from sqlalchemy import create_engine, text
from app.config import get_settings
s = get_settings()
engine = create_engine(s.database_url, isolation_level='AUTOCOMMIT')
with engine.connect() as conn:
    conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
    for t in ['evidence', 'graph_edges', 'graph_nodes', 'reports', 'validation_scores', 'investigations']:
        try:
            conn.execute(text(f"DELETE FROM {t}"))
            print(f"Cleared {t}")
        except Exception as e:
            print(f"Skipped {t}: {e}")
    conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
print("Done")
