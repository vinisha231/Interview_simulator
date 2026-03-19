from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.session import InterviewSession
from app.routers.auth import get_current_active_user


router = APIRouter(prefix="/api/activity", tags=["activity"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/calendar")
def get_calendar_month(
    year: int,
    month: int,
    tz_offset_minutes: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="month must be 1-12")

    start = date(year, month, 1)
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)

    try:
        # A "visited" day == a day the user practiced (saved an interview session).
        # We derive this from interview_sessions.created_at (server timestamps).
        start_dt = datetime.combine(start, datetime.min.time(), tzinfo=timezone.utc)
        end_dt = datetime.combine(next_month, datetime.min.time(), tzinfo=timezone.utc)
        sessions = (
            db.query(InterviewSession.created_at)
            .filter(InterviewSession.user_id == current_user.id)
            .filter(InterviewSession.created_at >= start_dt)
            .filter(InterviewSession.created_at < end_dt)
            .all()
        )

        offset = timedelta(minutes=int(tz_offset_minutes or 0))
        dates = set()
        for (created_at,) in sessions:
            if created_at is None:
                continue
            if getattr(created_at, "tzinfo", None) is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            local_dt = created_at - offset  # JS getTimezoneOffset(): local = UTC - offset
            dates.add(local_dt.date().isoformat())

        return {"year": year, "month": month, "visited_dates": sorted(dates)}
    except SQLAlchemyError as e:
        raise

