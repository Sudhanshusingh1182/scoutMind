"""Create investigation_steps table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-10 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    step_status_enum = sa.Enum('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING', 'SKIPPED', name='stepstatus')
    step_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'investigation_steps',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('investigation_id', sa.BigInteger(), sa.ForeignKey('investigations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('step_name', sa.String(100), nullable=False),
        sa.Column('status', step_status_enum, nullable=False, server_default='PENDING'),
        sa.Column('retry_count', sa.Integer(), server_default='0'),
        sa.Column('input_json', sa.Text(), nullable=True),
        sa.Column('output_json', sa.Text(), nullable=True),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('execution_time', sa.Integer(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('investigation_steps')
    sa.Enum(name='stepstatus').drop(op.get_bind(), checkfirst=True)
