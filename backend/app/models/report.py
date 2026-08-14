from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.base import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    investigation_id = Column(BigInteger, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, unique=True)
    report_json = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="report")
