"""telefono y direccion de empresa; baja logica de preguntas y documentos requeridos

Revision ID: b7c41e90a2d5
Revises: 75da950ebc8a
Create Date: 2026-10-05 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c41e90a2d5'
down_revision: Union[str, None] = '75da950ebc8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # CU-07, paso 9: teléfono y dirección de la empresa receptora.
    op.add_column('empresas_receptoras', sa.Column('telefono', sa.String(length=30), nullable=True))
    op.add_column('empresas_receptoras', sa.Column('direccion', sa.String(length=255), nullable=True))
    # CU-02, excepción 22.1.a: baja lógica de preguntas y documentos con respuestas/cargas.
    op.add_column(
        'preguntas_bitacora',
        sa.Column('activa', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    )
    op.add_column(
        'documentos_requeridos',
        sa.Column('activa', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('documentos_requeridos', 'activa')
    op.drop_column('preguntas_bitacora', 'activa')
    op.drop_column('empresas_receptoras', 'direccion')
    op.drop_column('empresas_receptoras', 'telefono')
