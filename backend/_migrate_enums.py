from sqlalchemy import create_engine, text
from app.config import get_settings

s = get_settings()
engine = create_engine(s.database_url, isolation_level='AUTOCOMMIT')

new_statuses = "'pending','researching','analyzing','debating','validating','completed','failed'"
new_node_types = "'IDEA','MARKET','CUSTOMER','COMPETITOR','PAIN_POINT','FEASIBILITY','MONETIZATION','DISTRIBUTION','RISK','ADVOCATE','SKEPTIC','INVESTOR','JUDGE','VERDICT','EVIDENCE','SCORE','REPORT','FOUNDER'"

with engine.connect() as conn:
    conn.execute(text(f"ALTER TABLE investigations MODIFY COLUMN status ENUM({new_statuses}) NOT NULL DEFAULT 'pending'"))
    print("Updated investigations.status")
    conn.execute(text(f"ALTER TABLE graph_nodes MODIFY COLUMN node_type ENUM({new_node_types}) NOT NULL"))
    print("Updated graph_nodes.node_type")

print("Done")
