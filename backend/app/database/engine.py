from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

SessionFactory = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_session():
    session = SessionFactory()
    try:
        yield session
    finally:
        session.close()
