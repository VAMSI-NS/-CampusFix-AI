import os
import json
import logging
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from datetime import datetime, timezone

try:
    import psycopg2
    from psycopg2 import pool, extras
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

logger = logging.getLogger("campusfix.database")

# Schema definitions
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(120) PRIMARY KEY,
    technician_id VARCHAR(60),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(120) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    netid VARCHAR(120) NOT NULL,
    roll_number VARCHAR(120),
    role VARCHAR(50) NOT NULL,
    specialization VARCHAR(100),
    department VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(50),
    active_assignments_count INT DEFAULT 0,
    avatar_initials VARCHAR(10),
    skills JSONB DEFAULT '[]'::jsonb,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_specialization ON users(specialization);

CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(120) PRIMARY KEY,
    ticket_number VARCHAR(60) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    device VARCHAR(255),
    netid VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    issue_summary TEXT,
    assigned_technician VARCHAR(255),
    ai_confidence FLOAT DEFAULT 0.85,
    diagnostic_stage VARCHAR(100) NOT NULL,
    diagnostic_progress INT DEFAULT 0,
    actions_taken JSONB DEFAULT '[]'::jsonb,
    resolution_details TEXT,
    escalation_info JSONB,
    chat_transcript TEXT,
    notes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

CREATE TABLE IF NOT EXISTS kb_articles (
    id VARCHAR(120) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    read_time_mins INT DEFAULT 2,
    summary TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    helpful_count INT DEFAULT 0,
    icon VARCHAR(60),
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON kb_articles(category);

CREATE TABLE IF NOT EXISTS service_status (
    id VARCHAR(120) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    uptime_percent FLOAT DEFAULT 99.9,
    latency_ms INT DEFAULT 15,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_live_monitored BOOLEAN DEFAULT TRUE,
    status_message TEXT NOT NULL,
    details TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(120) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'info',
    message TEXT NOT NULL,
    affected_services JSONB DEFAULT '[]'::jsonb,
    posted_at TIMESTAMPTZ DEFAULT NOW()
);
"""


class DatabaseManager:
    def __init__(self):
        self._pool: Optional[Any] = None
        self._is_connected = False
        self._database_url: Optional[str] = None

    def get_database_url(self) -> Optional[str]:
        if self._database_url:
            return self._database_url
        url = os.getenv("DATABASE_URL")
        if url and url.strip():
            clean_url = url.strip()
            # Ensure proper postgresql:// scheme
            if clean_url.startswith("postgres://"):
                clean_url = clean_url.replace("postgres://", "postgresql://", 1)
            # Remove channel_binding if present (Neon serverless pooler does not use channel_binding)
            clean_url = clean_url.replace("&channel_binding=require", "").replace("?channel_binding=require", "")
            # Ensure sslmode=require for Neon if not specified
            if "neon.tech" in clean_url and "sslmode=" not in clean_url:
                separator = "&" if "?" in clean_url else "?"
                clean_url = f"{clean_url}{separator}sslmode=require"
            self._database_url = clean_url
            return self._database_url
        return None

    def initialize(self) -> bool:
        """Initializes connection pool and ensures all tables exist."""
        if not PSYCOPG2_AVAILABLE:
            logger.warning("psycopg2 is not installed. Database will use in-memory mode.")
            return False

        url = self.get_database_url()
        if not url:
            logger.info("DATABASE_URL not configured. Operating in in-memory resilience mode.")
            return False

        try:
            logger.info("Connecting to PostgreSQL (Neon) database...")
            self._pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=url,
                connect_timeout=10,
            )
            self._is_connected = True

            # Run schema DDL
            self.create_tables()
            logger.info("Neon PostgreSQL connected and schemas validated successfully.")
            return True
        except Exception as e:
            self._is_connected = False
            self._pool = None
            logger.error(f"Failed to connect to Neon PostgreSQL database: {e}")
            return False

    def is_connected(self) -> bool:
        return self._is_connected and self._pool is not None

    @contextmanager
    def get_cursor(self, commit: bool = True):
        """Context manager yielding a cursor from the connection pool with auto-commit/rollback."""
        if not self.is_connected():
            raise RuntimeError("Database is not connected to PostgreSQL.")

        conn = self._pool.getconn()
        try:
            with conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
                yield cur
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._pool.putconn(conn)

    def create_tables(self):
        """Executes the DDL schema creation."""
        with self.get_cursor(commit=True) as cur:
            cur.execute(SCHEMA_SQL)

    def health_check(self) -> Dict[str, Any]:
        """Returns detailed connection status, latency, and table counts."""
        if not self.is_connected():
            return {
                "connected": False,
                "engine": "In-Memory Resilience Mode",
                "database_url_configured": bool(os.getenv("DATABASE_URL")),
                "message": "Running on memory storage. Set DATABASE_URL to connect to Neon PostgreSQL.",
            }

        start_time = datetime.now(timezone.utc)
        try:
            with self.get_cursor(commit=False) as cur:
                cur.execute("SELECT version();")
                version_info = cur.fetchone()
                db_version = version_info["version"] if version_info else "PostgreSQL"

                # Check table record counts
                cur.execute("SELECT COUNT(*) AS count FROM users;")
                users_count = cur.fetchone()["count"]

                cur.execute("SELECT COUNT(*) AS count FROM tickets;")
                tickets_count = cur.fetchone()["count"]

                cur.execute("SELECT COUNT(*) AS count FROM kb_articles;")
                kb_count = cur.fetchone()["count"]

            latency = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            return {
                "connected": True,
                "engine": "Neon Serverless PostgreSQL",
                "version": db_version.split()[0] + " " + db_version.split()[1] if len(db_version.split()) > 1 else db_version,
                "latency_ms": latency,
                "status": "healthy",
                "table_counts": {
                    "users": users_count,
                    "tickets": tickets_count,
                    "kb_articles": kb_count,
                },
                "ssl_active": True,
            }
        except Exception as e:
            return {
                "connected": False,
                "engine": "Neon PostgreSQL (Connection Error)",
                "error": str(e),
                "status": "degraded",
            }

    def close(self):
        if self._pool:
            self._pool.closeall()
            self._is_connected = False


db = DatabaseManager()
