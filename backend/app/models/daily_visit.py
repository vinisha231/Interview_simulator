from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class UserDailyVisit(Base):
    """
    One row per user per day that they have opened the app.
    Used for streaks and the calendar view.
    """

    __tablename__ = "user_daily_visits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    visit_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "visit_date", name="uq_user_daily_visits_user_date"),
    )

