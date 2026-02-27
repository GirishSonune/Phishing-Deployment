import sqlite3
import os

db_path = "whitelist.db"
if not os.path.exists(db_path):
    print("DB not found")
else:
    conn = sqlite3.connect(db_path)
    count = conn.execute("SELECT COUNT(*) FROM whitelist").fetchone()[0]
    print(f"Total Whitelist Entries: {count:,}")
    conn.close()
