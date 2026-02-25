"""add strength_highlight to interview_sessions

Revision ID: a1b2c3d4e5f6
Revises: 3f4c2a9d7b1e
Create Date: 2026-02-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3f4c2a9d7b1e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('interview_sessions', sa.Column('strength_highlight', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('interview_sessions', 'strength_highlight')
