"""archivos subidos en base de datos

Revision ID: e5a1b7c93d20
Revises: c2d9f0a31e47
Create Date: 2026-10-06 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5a1b7c93d20'
down_revision: Union[str, None] = 'c2d9f0a31e47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'archivos_subidos',
        sa.Column('nombre', sa.String(length=255), nullable=False),
        sa.Column('contenido', sa.LargeBinary(), nullable=False),
        sa.Column('tipo_contenido', sa.String(length=100), nullable=False),
        sa.Column('tamano_bytes', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('fecha_carga', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('nombre'),
    )


def downgrade() -> None:
    op.drop_table('archivos_subidos')
