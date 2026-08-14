from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class PainPoint(Base):
    __tablename__ = "pain_points"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    investigation_id = Column(BigInteger, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=True)
    frequency = Column(String(50), nullable=True)
    affected_users = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="pain_points")
