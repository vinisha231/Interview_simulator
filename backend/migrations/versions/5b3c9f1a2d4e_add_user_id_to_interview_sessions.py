"""add user_id to interview_sessions

Revision ID: 5b3c9f1a2d4e
Revises: 8b7d2a1f3c9e
Create Date: 2026-01-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b3c9f1a2d4e'
down_revision: Union[str, None] = '8b7d2a1f3c9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('interview_sessions', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_interview_sessions_user_id_users',
        'interview_sessions',
        'users',
        ['user_id'],
        ['id']
    )


def downgrade() -> None:
    op.drop_constraint('fk_interview_sessions_user_id_users', 'interview_sessions', type_='foreignkey')
    op.drop_column('interview_sessions', 'user_id')
