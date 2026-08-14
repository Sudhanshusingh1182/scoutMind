from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class MarketGap(Base):
    __tablename__ = "market_gaps"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    investigation_id = Column(BigInteger, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    underserved_users = Column(String(500), nullable=True)
    opportunity_type = Column(String(100), nullable=True)
    potential = Column(String(100), nullable=True)
    why_now = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="market_gaps_rel")
