"""add notes to interview_sessions

Revision ID: 9c2f1b4a8d7e
Revises: 5b3c9f1a2d4e
Create Date: 2026-02-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c2f1b4a8d7e'
down_revision: Union[str, None] = '0a1b2c3d4e5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('interview_sessions', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('interview_sessions', 'notes')
