"""add difficulty to interview_sessions

Revision ID: 3f4c2a9d7b1e
Revises: 9c2f1b4a8d7e
Create Date: 2026-02-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f4c2a9d7b1e'
down_revision: Union[str, None] = '9c2f1b4a8d7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('interview_sessions', sa.Column('difficulty', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('interview_sessions', 'difficulty')
