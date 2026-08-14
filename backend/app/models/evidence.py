from sqlalchemy import Column, BigInteger, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.base import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    investigation_id = Column(BigInteger, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    research_question_id = Column(BigInteger, ForeignKey("research_questions.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(500), nullable=False)
    url = Column(String(2048), nullable=False)
    summary = Column(String(2000), nullable=False)
    relevance_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="evidence")
