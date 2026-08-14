from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.database.base import Base


class InvestigationStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_statement = Column(String(500), nullable=False)
    status = Column(SAEnum(InvestigationStatus), nullable=False, default=InvestigationStatus.RUNNING, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="investigations")
    research_questions = relationship("ResearchQuestion", back_populates="investigation", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="investigation", cascade="all, delete-orphan")
    project_ideas = relationship("ProjectIdea", back_populates="investigation", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="investigation", uselist=False, cascade="all, delete-orphan")
    steps = relationship("InvestigationStep", back_populates="investigation", cascade="all, delete-orphan", order_by="InvestigationStep.id")
    pain_points = relationship("PainPoint", back_populates="investigation", cascade="all, delete-orphan")
    root_causes = relationship("RootCause", back_populates="investigation", cascade="all, delete-orphan")
    existing_solutions = relationship("ExistingSolution", back_populates="investigation", cascade="all, delete-orphan")
    market_gaps_rel = relationship("MarketGap", back_populates="investigation", cascade="all, delete-orphan")
