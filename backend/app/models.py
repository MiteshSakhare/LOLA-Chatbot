import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

class Database:
    """Database connection and query manager"""
    
    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def _initialize_db(self):
        """Initialize database schema"""
        schema_path = Path(__file__).parent.parent / 'migrations' / 'init_schema.sql'
        with open(schema_path, 'r') as f:
            schema = f.read()
        
        with self.get_connection() as conn:
            conn.executescript(schema)


class Session:
    """Session model"""
    
    def __init__(self, db: Database):
        self.db = db
    
    def create(self, session_id: str, ip_address: str, user_agent: str) -> Dict[str, Any]:
        """Create a new session"""
        with self.db.get_connection() as conn:
            conn.execute(
                """INSERT INTO sessions (id, ip_address, user_agent, status)
                   VALUES (?, ?, ?, 'in_progress')""",
                (session_id, ip_address, user_agent)
            )
        return self.get(session_id)
    
    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM sessions WHERE id = ?",
                (session_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def update_status(self, session_id: str, status: str):
        """Update session status"""
        with self.db.get_connection() as conn:
            conn.execute(
                """UPDATE sessions 
                   SET status = ?, last_updated = CURRENT_TIMESTAMP
                   WHERE id = ?""",
                (status, session_id)
            )
    
    def touch(self, session_id: str):
        """Update last_updated timestamp"""
        with self.db.get_connection() as conn:
            conn.execute(
                "UPDATE sessions SET last_updated = CURRENT_TIMESTAMP WHERE id = ?",
                (session_id,)
            )
    
    def delete(self, session_id: str):
        """Delete a session"""
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    
    def cleanup_abandoned(self, minutes: int = 30):
        """Delete sessions that haven't been updated in X minutes and have no answers"""
        with self.db.get_connection() as conn:
            conn.execute(
                """DELETE FROM sessions 
                   WHERE status = 'in_progress' 
                   AND id NOT IN (SELECT DISTINCT session_id FROM answers)
                   AND datetime(last_updated) < datetime('now', '-' || ? || ' minutes')""",
                (minutes,)
            )
            return conn.total_changes
    
    def list_all(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """List all sessions with pagination"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                """SELECT * FROM session_summary 
                   ORDER BY created_at DESC LIMIT ? OFFSET ?""",
                (limit, offset)
            )
            return [dict(row) for row in cursor.fetchall()]
    
    def count(self) -> int:
        """Count total sessions"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT COUNT(*) as count FROM sessions")
            return cursor.fetchone()['count']



class Answer:
    """Answer model"""
    
    def __init__(self, db: Database):
        self.db = db
    
    def save(self, session_id: str, question_id: str, answer_text: str):
        """Save or update an answer"""
        with self.db.get_connection() as conn:
            conn.execute(
                """INSERT INTO answers (session_id, question_id, answer_text)
                   VALUES (?, ?, ?)
                   ON CONFLICT(session_id, question_id)
                   DO UPDATE SET answer_text = excluded.answer_text,
                                created_at = CURRENT_TIMESTAMP""",
                (session_id, question_id, answer_text)
            )
    
    def get_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all answers for a session"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                """SELECT question_id, answer_text, created_at
                   FROM answers WHERE session_id = ?
                   ORDER BY created_at""",
                (session_id,)
            )
            return [dict(row) for row in cursor.fetchall()]
    
    def get(self, session_id: str, question_id: str) -> Optional[str]:
        """Get specific answer"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                """SELECT answer_text FROM answers 
                   WHERE session_id = ? AND question_id = ?""",
                (session_id, question_id)
            )
            row = cursor.fetchone()
            return row['answer_text'] if row else None
