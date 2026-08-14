from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.base import Base


class ProjectIdeaCitation(Base):
    __tablename__ = "project_idea_citations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    project_idea_id = Column(BigInteger, ForeignKey("project_ideas.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_id = Column(BigInteger, ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True)
    source_title = Column(String(500), nullable=True)
    source_url = Column(String(2048), nullable=True)
    snippet = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    project_idea = relationship("ProjectIdea", back_populates="citations")
