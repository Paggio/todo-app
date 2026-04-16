"""add categories table and expand todos

Revision ID: b5c6d7e8f9a0
Revises: a1b2c3d4e5f6
Create Date: 2026-04-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b5c6d7e8f9a0'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_categories_user_id_users'),
        sa.PrimaryKeyConstraint('id', name='pk_categories'),
    )
    # 2. Index on categories.user_id
    op.create_index('idx_categories_user_id', 'categories', ['user_id'])
    # 3. Composite unique constraint on (user_id, name)
    op.create_unique_constraint('uq_categories_user_id_name', 'categories', ['user_id', 'name'])

    # 4-6. Add new columns to todos table
    with op.batch_alter_table('todos') as batch_op:
        batch_op.add_column(
            sa.Column('category_id', sa.Integer(), nullable=True)
        )
        batch_op.add_column(
            sa.Column('deadline', sa.Date(), nullable=True)
        )
        batch_op.add_column(
            sa.Column('priority', sa.Integer(), nullable=True)
        )
        # 7. Foreign key constraint for category_id
        batch_op.create_foreign_key(
            'fk_todos_category_id_categories',
            'categories',
            ['category_id'],
            ['id'],
            ondelete='SET NULL',
        )
        # 8. Indexes on new columns
        batch_op.create_index('idx_todos_category_id', ['category_id'])
        batch_op.create_index('idx_todos_deadline', ['deadline'])


def downgrade() -> None:
    with op.batch_alter_table('todos') as batch_op:
        batch_op.drop_index('idx_todos_deadline')
        batch_op.drop_index('idx_todos_category_id')
        batch_op.drop_constraint('fk_todos_category_id_categories', type_='foreignkey')
        batch_op.drop_column('priority')
        batch_op.drop_column('deadline')
        batch_op.drop_column('category_id')

    op.drop_constraint('uq_categories_user_id_name', 'categories', type_='unique')
    op.drop_index('idx_categories_user_id', table_name='categories')
    op.drop_table('categories')
