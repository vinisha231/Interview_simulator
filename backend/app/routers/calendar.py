from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.calendar_event import UserCalendarEvent
from app.routers.auth import get_current_active_user


router = APIRouter(prefix="/api/calendar", tags=["calendar"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CalendarEventCreate(BaseModel):
    event_date: str  # YYYY-MM-DD
    title: str
    start_time: str | None = None  # HH:MM or H:MM
    end_time: str | None = None
    notes: str | None = None


class CalendarEventUpdate(BaseModel):
    event_date: str | None = None
    title: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    notes: str | None = None


def _parse_date(s: str) -> date:
    try:
        return date.fromisoformat(s)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="event_date must be YYYY-MM-DD")


def _normalize_time(t: str) -> str:
    """Normalize 'H:MM' or 'HH:MM' to 'HH:MM' for comparison."""
    if not t or not t.strip():
        return ""
    parts = t.strip().split(":")
    if len(parts) != 2:
        return t.strip()
    h, m = parts[0].zfill(2), parts[1].zfill(2) if len(parts[1]) <= 2 else parts[1][:2].zfill(2)
    return f"{h}:{m}"


def _validate_times(start_time: str | None, end_time: str | None) -> None:
    """Raise 400 if both set and end is not after start."""
    if not start_time or not end_time:
        return
    s = _normalize_time(start_time)
    e = _normalize_time(end_time)
    if s and e and e <= s:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time (e.g. 1:15 PM to 3:30 PM).",
        )


def _event_to_item(e: UserCalendarEvent) -> dict:
    return {
        "id": e.id,
        "event_date": e.event_date.isoformat() if e.event_date else None,
        "title": e.title,
        "start_time": e.start_time,
        "end_time": e.end_time,
        "notes": e.notes,
    }


_MISSING_TABLE_MSG = (
    "Calendar events table is missing on the database. "
    "Ensure DATABASE_URL on the server points to RDS and redeploy (container runs alembic upgrade head). "
    "If other tables exist but calendar does not, the DB may need a one-time alembic stamp then upgrade — see README."
)


def _reraise_calendar_db(db: Session, exc: Exception) -> None:
    """Only remap clear 'relation does not exist' errors; other DB errors propagate."""
    db.rollback()
    err = str(getattr(exc, "orig", None) or exc).lower()
    if "user_calendar_events" in err or (
        "relation" in err and "does not exist" in err
    ):
        raise HTTPException(status_code=503, detail=_MISSING_TABLE_MSG) from exc
    raise


@router.get("/events")
def list_events(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="month must be 1-12")
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)

    try:
        events = (
            db.query(UserCalendarEvent)
            .filter(UserCalendarEvent.user_id == current_user.id)
            .filter(UserCalendarEvent.event_date >= start)
            .filter(UserCalendarEvent.event_date < end)
            .order_by(UserCalendarEvent.event_date, UserCalendarEvent.start_time)
            .all()
        )
    except SQLAlchemyError as e:
        _reraise_calendar_db(db, e)

    by_date = {}
    for e in events:
        d = e.event_date.isoformat()
        if d not in by_date:
            by_date[d] = []
        by_date[d].append(_event_to_item(e))
    return {"year": year, "month": month, "events_by_date": by_date }


@router.post("/events")
def create_event(
    body: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    _validate_times(body.start_time, body.end_time)
    event_date = _parse_date(body.event_date)
    event = UserCalendarEvent(
        user_id=current_user.id,
        event_date=event_date,
        title=body.title.strip() or "Untitled",
        start_time=body.start_time.strip() if body.start_time else None,
        end_time=body.end_time.strip() if body.end_time else None,
        notes=body.notes.strip() if body.notes else None,
    )
    try:
        db.add(event)
        db.commit()
        db.refresh(event)
    except SQLAlchemyError as e:
        _reraise_calendar_db(db, e)
    return _event_to_item(event)


@router.patch("/events/{event_id}")
def update_event(
    event_id: int,
    body: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        event = (
            db.query(UserCalendarEvent)
            .filter(UserCalendarEvent.id == event_id, UserCalendarEvent.user_id == current_user.id)
            .first()
        )
    except SQLAlchemyError as e:
        _reraise_calendar_db(db, e)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    start = body.start_time if body.start_time is not None else event.start_time
    end = body.end_time if body.end_time is not None else event.end_time
    _validate_times(start, end)
    if body.event_date is not None:
        event.event_date = _parse_date(body.event_date)
    if body.title is not None:
        event.title = body.title.strip() or "Untitled"
    if body.start_time is not None:
        event.start_time = body.start_time.strip() or None
    if body.end_time is not None:
        event.end_time = body.end_time.strip() or None
    if body.notes is not None:
        event.notes = body.notes.strip() or None
    try:
        db.commit()
        db.refresh(event)
    except SQLAlchemyError as e:
        _reraise_calendar_db(db, e)
    return _event_to_item(event)


@router.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    try:
        event = (
            db.query(UserCalendarEvent)
            .filter(UserCalendarEvent.id == event_id, UserCalendarEvent.user_id == current_user.id)
            .first()
        )
    except SQLAlchemyError as e:
        _reraise_calendar_db(db, e)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    try:
        db.delete(event)
        db.commit()
    except SQLAlchemyError as e:
        _reraise_calendar_db(db, e)
    return {"ok": True}
