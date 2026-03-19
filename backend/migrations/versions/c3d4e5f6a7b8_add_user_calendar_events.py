"""add user_calendar_events table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'dfe3c2a1b9f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_calendar_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('event_date', sa.Date(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('start_time', sa.String(10), nullable=True),
        sa.Column('end_time', sa.String(10), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_calendar_events_id'), 'user_calendar_events', ['id'], unique=False)
    op.create_index('ix_user_calendar_events_user_date', 'user_calendar_events', ['user_id', 'event_date'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_user_calendar_events_user_date', table_name='user_calendar_events')
    op.drop_index(op.f('ix_user_calendar_events_id'), table_name='user_calendar_events')
    op.drop_table('user_calendar_events')
