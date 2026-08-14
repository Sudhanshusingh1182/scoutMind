from sqlalchemy import create_engine, text
from app.config import get_settings
s = get_settings()
engine = create_engine(s.database_url, isolation_level='AUTOCOMMIT')
with engine.connect() as conn:
    r = conn.execute(text("SHOW COLUMNS FROM investigations LIKE 'status'"))
    print(r.fetchone())
