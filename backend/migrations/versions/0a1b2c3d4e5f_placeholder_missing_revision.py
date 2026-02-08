"""placeholder for missing revision

Revision ID: 0a1b2c3d4e5f
Revises: 5b3c9f1a2d4e
Create Date: 2026-02-08 00:00:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '0a1b2c3d4e5f'
down_revision: Union[str, None] = '5b3c9f1a2d4e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op placeholder to restore revision history.
    pass


def downgrade() -> None:
    # No-op placeholder to restore revision history.
    pass
