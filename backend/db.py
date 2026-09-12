import sqlite3

DB_FILE = "data/dofe_agencies.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Ensures the reports table exists with all required columns."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Check if existing reports table is missing permission_no
    cursor.execute("PRAGMA table_info(reports)")
    columns = [row["name"] for row in cursor.fetchall()]
    
    if columns and "permission_no" not in columns:
        cursor.execute("DROP TABLE reports;")
        print("Dropped legacy 'reports' table structure.")
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agency_id INTEGER NOT NULL,
            permission_no TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            answers_json TEXT NOT NULL,
            comment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES agencies (id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()
    print("Database initialized: 'reports' table verified.")