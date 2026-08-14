from sqlalchemy import Column, BigInteger, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.base import Base


class StartupIdea(Base):
    __tablename__ = "startup_ideas"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    investigation_id = Column(BigInteger, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    problem = Column(String(2000), nullable=True)
    solution = Column(String(2000), nullable=True)
    target_customer = Column(String(500), nullable=True)
    differentiation = Column(String(2000), nullable=True)
    mvp = Column(String(2000), nullable=True)
    pricing_model = Column(String(500), nullable=True)
    market_score = Column(Integer, default=0)
    feasibility_score = Column(Integer, default=0)
    innovation_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="startup_ideas")
