from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database.base import Base


class AuthProvider(str, enum.Enum):
    EMAIL = "EMAIL"
    GOOGLE = "GOOGLE"


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    auth_provider = Column(SAEnum(AuthProvider), nullable=False, default=AuthProvider.EMAIL)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    investigations = relationship("Investigation", back_populates="user", cascade="all, delete-orphan")
