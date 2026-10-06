"""fecha de rechazo del cierre formal en postulaciones

Revision ID: c2d9f0a31e47
Revises: b7c41e90a2d5
Create Date: 2026-10-05 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2d9f0a31e47'
down_revision: Union[str, None] = 'b7c41e90a2d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # CU-05, flujo alterno 9.1.a: cuándo se rechazó el cierre formal.
    op.add_column('postulaciones', sa.Column('fecha_rechazo_cierre', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('postulaciones', 'fecha_rechazo_cierre')
