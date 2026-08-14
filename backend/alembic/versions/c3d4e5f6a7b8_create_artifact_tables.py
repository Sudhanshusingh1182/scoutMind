"""Create pain_points, root_causes, existing_solutions, market_gaps tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-10 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'pain_points',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('investigation_id', sa.BigInteger(), sa.ForeignKey('investigations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(50), nullable=True),
        sa.Column('frequency', sa.String(50), nullable=True),
        sa.Column('affected_users', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'root_causes',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('investigation_id', sa.BigInteger(), sa.ForeignKey('investigations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('root_cause', sa.Text(), nullable=False),
        sa.Column('depth', sa.Integer(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'existing_solutions',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('investigation_id', sa.BigInteger(), sa.ForeignKey('investigations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('strengths', sa.Text(), nullable=True),
        sa.Column('weaknesses', sa.Text(), nullable=True),
        sa.Column('missing_features', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'market_gaps',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('investigation_id', sa.BigInteger(), sa.ForeignKey('investigations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('underserved_users', sa.String(500), nullable=True),
        sa.Column('opportunity_type', sa.String(100), nullable=True),
        sa.Column('potential', sa.String(100), nullable=True),
        sa.Column('why_now', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('market_gaps')
    op.drop_table('existing_solutions')
    op.drop_table('root_causes')
    op.drop_table('pain_points')
