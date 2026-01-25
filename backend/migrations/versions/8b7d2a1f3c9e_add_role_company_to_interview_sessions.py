"""add role/company to interview_sessions

Revision ID: 8b7d2a1f3c9e
Revises: c9bc10e4a40b
Create Date: 2026-01-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b7d2a1f3c9e'
down_revision: Union[str, None] = 'c9bc10e4a40b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('interview_sessions', sa.Column('role', sa.String(length=120), nullable=True))
    op.add_column('interview_sessions', sa.Column('company', sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column('interview_sessions', 'company')
    op.drop_column('interview_sessions', 'role')
