import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Use a database path relative to this file's directory
_base_dir = os.path.dirname(os.path.abspath(__file__))
_default_db = f"sqlite:///{os.path.join(_base_dir, 'gap_analyzer.db')}"

DATABASE_URL = os.getenv("DATABASE_URL", _default_db)

# check_same_thread is only needed for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database with schema (run once)"""
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with engine.connect() as conn:
        with open(schema_path, 'r') as f:
            sql = f.read()
        # Split by semicolon and execute each statement
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        for stmt in statements:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"Warning executing statement: {e}")
        conn.commit()
    print("✅ Database initialized successfully")
