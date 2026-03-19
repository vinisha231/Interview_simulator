"""Create user daily visits table

Tracks a per-user per-day "visit" so we can compute streaks and show a calendar.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "dfe3c2a1b9f4"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_daily_visits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("visit_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_daily_visits_user_id"), "user_daily_visits", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_daily_visits_visit_date"), "user_daily_visits", ["visit_date"], unique=False)
    op.create_unique_constraint(
        "uq_user_daily_visits_user_date",
        "user_daily_visits",
        ["user_id", "visit_date"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_user_daily_visits_user_date", "user_daily_visits", type_="unique")
    op.drop_index(op.f("ix_user_daily_visits_visit_date"), table_name="user_daily_visits")
    op.drop_index(op.f("ix_user_daily_visits_user_id"), table_name="user_daily_visits")
    op.drop_table("user_daily_visits")

