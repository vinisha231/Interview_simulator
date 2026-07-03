import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from sqlalchemy.exc import SQLAlchemyError
from app.config import IS_PRODUCTION
from app.database import SessionLocal
from app.models.user import User
from app.models.session import InterviewSession
from app.models.daily_visit import UserDailyVisit
from app.models.calendar_event import UserCalendarEvent
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Security configuration (use env so login works on EB and across restarts).
# In production a stable SECRET_KEY is REQUIRED: without it, each gunicorn worker
# would generate its own key, so tokens minted by one worker fail on another and
# every restart silently invalidates all sessions. Fail fast instead of guessing.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise RuntimeError(
            "SECRET_KEY is not set. Set a stable SECRET_KEY environment variable "
            "(e.g. `openssl rand -hex 32`) on the server before starting in production."
        )
    logger.warning(
        "SECRET_KEY not set; generating an ephemeral key for local development. "
        "Tokens will not survive a restart. Set SECRET_KEY in backend/.env to persist logins."
    )
    SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# Pydantic schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return str(v).strip().lower()

    @field_validator("username")
    @classmethod
    def strip_username(cls, v: str) -> str:
        s = str(v).strip()
        if len(s) < 2:
            raise ValueError("Username must be at least 2 characters")
        return s


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class UserUpdate(BaseModel):
    full_name: Optional[str] = None


class PasswordConfirmBody(BaseModel):
    password: str


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Helper functions
def verify_password(plain_password, hashed_password):
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def _db_error_detail(ex: Exception) -> str:
    """Turn DB errors into a clear message for the client."""
    msg = str(ex).lower()
    if "relation" in msg and "does not exist" in msg:
        return "Database tables missing. Run in backend: alembic upgrade head"
    if "connection" in msg or "could not connect" in msg or "refused" in msg:
        return "Cannot connect to database. Check DATABASE_URL and that the DB is running."
    return "Database error. Check DATABASE_URL and run: alembic upgrade head"


# API Routes
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    - **username**: Unique username (required)
    - **email**: Valid email address (required)
    - **password**: Password (will be hashed)
    - **full_name**: Optional full name
    """
    try:
        # Check if user already exists
        db_user = db.query(User).filter(
            (User.username == user_data.username)
            | (func.lower(User.email) == user_data.email.lower())
        ).first()

        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered",
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=str(user_data.email).strip().lower(),
            hashed_password=hashed_password,
            full_name=user_data.full_name,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.exception("Register DB error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_db_error_detail(e),
        )
    except Exception as e:
        logger.exception("Register error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_db_error_detail(e),
        )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Login with username and password.

    Returns JWT access token.
    """
    try:
        # Authenticate user
        identifier = (form_data.username or "").strip().lower()
        user = db.query(User).filter(
            or_(
                func.lower(User.username) == identifier,
                func.lower(User.email) == identifier,
            )
        ).first()

        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
        }
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.exception("Login DB error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_db_error_detail(e),
        )
    except Exception as e:
        logger.exception("Login error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_db_error_detail(e),
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update current user's profile fields (currently: full_name)."""
    try:
        if body.full_name is not None:
            name = str(body.full_name).strip()
            current_user.full_name = name or None
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return current_user
    except SQLAlchemyError as e:
        logger.exception("Update user DB error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_db_error_detail(e),
        )


@router.post("/me/disable-account")
def disable_account(
    body: PasswordConfirmBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Set is_active to False. User cannot log in until re-enabled in the database."""
    if not verify_password(body.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")
    try:
        current_user.is_active = False
        db.add(current_user)
        db.commit()
        return {"ok": True}
    except SQLAlchemyError as e:
        logger.exception("Disable account DB error")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_db_error_detail(e),
        )


@router.post("/me/delete-account")
def delete_account(
    body: PasswordConfirmBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Permanently delete the account and related sessions, visits, and calendar events."""
    if not verify_password(body.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")
    uid = current_user.id
    try:
        db.query(InterviewSession).filter(InterviewSession.user_id == uid).delete()
        db.query(UserDailyVisit).filter(UserDailyVisit.user_id == uid).delete()
        db.query(UserCalendarEvent).filter(UserCalendarEvent.user_id == uid).delete()
        db.query(User).filter(User.id == uid).delete()
        db.commit()
        return {"ok": True}
    except SQLAlchemyError as e:
        logger.exception("Delete account DB error")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_db_error_detail(e),
        )


@router.get("/users/count")
def get_users_count(db: Session = Depends(get_db)):
    """Total registered users (same access model as GET /users — for admin/local curl)."""
    total = db.query(func.count(User.id)).scalar() or 0
    return {"total": total}


@router.get("/users", response_model=list[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all users with safe info: id, username, email, full_name, is_active, created_at (for admin/testing). Passwords are never returned."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

