from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class RootCause(Base):
    __tablename__ = "root_causes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    investigation_id = Column(BigInteger, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    root_cause = Column(Text, nullable=False)
    depth = Column(Integer, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="root_causes")
