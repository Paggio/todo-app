"""create todos table

Revision ID: a1b2c3d4e5f6
Revises: 7e729bfa2ac7
Create Date: 2026-04-15 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '7e729bfa2ac7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'todos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_todos_user_id_users'),
        sa.PrimaryKeyConstraint('id', name='pk_todos'),
    )
    # Architecture naming convention: idx_{table}_{column}
    op.create_index('idx_todos_user_id', 'todos', ['user_id'])

    # Optional: fix users.created_at to be timezone-aware (Retro T2)
    op.alter_column('users', 'created_at', type_=sa.DateTime(timezone=True), existing_type=sa.DateTime())


def downgrade() -> None:
    # Revert users.created_at timezone fix
    op.alter_column('users', 'created_at', type_=sa.DateTime(), existing_type=sa.DateTime(timezone=True))

    op.drop_index('idx_todos_user_id', table_name='todos')
    op.drop_table('todos')
