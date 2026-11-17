"""restablecer contraseña y notificaciones internas

Revision ID: f6b2c8d41a93
Revises: e5a1b7c93d20
Create Date: 2026-11-17 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6b2c8d41a93'
down_revision: Union[str, None] = 'e5a1b7c93d20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'restablecimientos_password',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('creado_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('expira_en', sa.DateTime(), nullable=False),
        sa.Column('usado', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_restablecimientos_password_token_hash',
        'restablecimientos_password',
        ['token_hash'],
        unique=True,
    )

    op.create_table(
        'notificaciones_usuario',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('evento', sa.String(length=60), nullable=False),
        sa.Column('titulo', sa.String(length=150), nullable=False),
        sa.Column('mensaje', sa.Text(), nullable=False),
        sa.Column('ruta', sa.String(length=200), nullable=True),
        sa.Column('leida', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('creada_en', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_notificaciones_usuario_usuario_leida',
        'notificaciones_usuario',
        ['usuario_id', 'leida', 'creada_en'],
    )


def downgrade() -> None:
    op.drop_index('ix_notificaciones_usuario_usuario_leida', table_name='notificaciones_usuario')
    op.drop_table('notificaciones_usuario')
    op.drop_index('ix_restablecimientos_password_token_hash', table_name='restablecimientos_password')
    op.drop_table('restablecimientos_password')
