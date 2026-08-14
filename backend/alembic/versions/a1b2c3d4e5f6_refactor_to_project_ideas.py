"""Refactor to project ideas - rename topic to problem_statement, add project_ideas and citations tables

Revision ID: a1b2c3d4e5f6
Revises: 9318270a4d38
Create Date: 2026-07-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9318270a4d38'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename topic -> problem_statement on investigations
    op.alter_column('investigations', 'topic', new_column_name='problem_statement', type_=sa.String(2000))

    # Drop old startup_ideas table if it exists
    op.execute("DROP TABLE IF EXISTS startup_ideas")

    # Create project_ideas table
    op.create_table(
        'project_ideas',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('investigation_id', sa.BigInteger(), sa.ForeignKey('investigations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('elevator_pitch', sa.String(1000), nullable=True),
        sa.Column('problem', sa.String(2000), nullable=True),
        sa.Column('solution', sa.String(2000), nullable=True),
        sa.Column('target_customer', sa.String(500), nullable=True),
        sa.Column('why_now', sa.String(1000), nullable=True),
        sa.Column('differentiation', sa.String(2000), nullable=True),
        sa.Column('mvp', sa.String(2000), nullable=True),
        sa.Column('pricing_model', sa.String(500), nullable=True),
        sa.Column('technical_complexity', sa.String(50), nullable=True),
        sa.Column('potential_impact', sa.String(50), nullable=True),
        sa.Column('business_potential', sa.String(50), nullable=True),
        sa.Column('future_expansion', sa.String(2000), nullable=True),
        sa.Column('practical_usefulness_score', sa.Integer(), default=0),
        sa.Column('originality_score', sa.Integer(), default=0),
        sa.Column('innovation_score', sa.Integer(), default=0),
        sa.Column('technical_feasibility_score', sa.Integer(), default=0),
        sa.Column('portfolio_value_score', sa.Integer(), default=0),
        sa.Column('business_potential_score', sa.Integer(), default=0),
        sa.Column('development_effort_score', sa.Integer(), default=0),
        sa.Column('market_demand_score', sa.Integer(), default=0),
        sa.Column('overall_score', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # Create project_idea_citations table
    op.create_table(
        'project_idea_citations',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('project_idea_id', sa.BigInteger(), sa.ForeignKey('project_ideas.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('evidence_id', sa.BigInteger(), sa.ForeignKey('evidence.id', ondelete='SET NULL'), nullable=True),
        sa.Column('source_title', sa.String(500), nullable=True),
        sa.Column('source_url', sa.String(2048), nullable=True),
        sa.Column('snippet', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('project_idea_citations')
    op.drop_table('project_ideas')
    op.alter_column('investigations', 'problem_statement', new_column_name='topic')
