from sqlalchemy import Column, BigInteger, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.base import Base


class ProjectIdea(Base):
    __tablename__ = "project_ideas"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    investigation_id = Column(BigInteger, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    elevator_pitch = Column(String(1000), nullable=True)
    problem = Column(String(2000), nullable=True)
    solution = Column(String(2000), nullable=True)
    target_customer = Column(String(500), nullable=True)
    why_now = Column(String(1000), nullable=True)
    differentiation = Column(String(2000), nullable=True)
    mvp = Column(String(2000), nullable=True)
    pricing_model = Column(String(500), nullable=True)
    technical_complexity = Column(String(50), nullable=True)
    potential_impact = Column(String(50), nullable=True)
    business_potential = Column(String(50), nullable=True)
    future_expansion = Column(String(2000), nullable=True)
    practical_usefulness_score = Column(Integer, default=0)
    originality_score = Column(Integer, default=0)
    innovation_score = Column(Integer, default=0)
    technical_feasibility_score = Column(Integer, default=0)
    portfolio_value_score = Column(Integer, default=0)
    business_potential_score = Column(Integer, default=0)
    development_effort_score = Column(Integer, default=0)
    market_demand_score = Column(Integer, default=0)
    overall_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="project_ideas")
    citations = relationship("ProjectIdeaCitation", back_populates="project_idea", cascade="all, delete-orphan")
