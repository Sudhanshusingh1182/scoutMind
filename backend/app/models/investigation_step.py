from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, DateTime, Text, Integer, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.database.base import Base


class StepStatus(str, enum.Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class InvestigationStep(Base):
    __tablename__ = "investigation_steps"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    investigation_id = Column(BigInteger, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    step_name = Column(String(100), nullable=False)
    status = Column(SAEnum(StepStatus), nullable=False, default=StepStatus.PENDING)
    retry_count = Column(Integer, default=0)
    input_json = Column(Text, nullable=True)
    output_json = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    execution_time = Column(Integer, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    investigation = relationship("Investigation", back_populates="steps")
