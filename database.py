import sqlite3

def get_db():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS treinos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bpm INTEGER,
            beats INTEGER,
            tolerance INTEGER,
            accuracy INTEGER,
            avg_error INTEGER,
            min_error INTEGER,
            max_error INTEGER,
            created_at TEXT
        );
    """)
    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    print("Banco criado com sucesso!")
