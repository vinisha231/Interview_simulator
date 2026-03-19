from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class UserCalendarEvent(Base):
    __tablename__ = "user_calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_date = Column(Date, nullable=False)
    title = Column(String(200), nullable=False)
    start_time = Column(String(10), nullable=True)   # e.g. "13:15"
    end_time = Column(String(10), nullable=True)    # e.g. "15:30"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
