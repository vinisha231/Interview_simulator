"""add time_spent_seconds and session_total_seconds to interview_sessions

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('interview_sessions', sa.Column('time_spent_seconds', sa.Integer(), nullable=True))
    op.add_column('interview_sessions', sa.Column('session_total_seconds', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('interview_sessions', 'session_total_seconds')
    op.drop_column('interview_sessions', 'time_spent_seconds')
