import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

# ==========================================
# SHARED HELPER: TIMESTAMP FORMATTER
# ==========================================
def format_timestamp_iso(timestamp_str):
    """
    Converts SQLite UTC timestamp to IST ISO format.
    Fixes "Invalid Date" on frontend and ensures correct timezone.
    """
    if not timestamp_str:
        return None
    
    try:
        # Parse the UTC timestamp from SQLite
        if isinstance(timestamp_str, str):
            # Try different formats likely to come from SQLite
            for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f']:
                try:
                    dt = datetime.strptime(timestamp_str, fmt)
                    # Add 5:30 hours for IST
                    ist_dt = dt + timedelta(hours=5, minutes=30)
                    # Return ISO format (e.g., 2026-01-06T14:30:00)
                    return ist_dt.isoformat()
                except ValueError:
                    continue
        
        return timestamp_str
    except Exception as e:
        print(f"Timestamp format error: {e}")
        return timestamp_str


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
        
        if not schema_path.exists():
            print(f"⚠️ Warning: Schema file not found at {schema_path}")
            return
            
        with open(schema_path, 'r') as f:
            schema = f.read()
        
        with self.get_connection() as conn:
            conn.executescript(schema)


class Session:
    """Session model with proper timestamp handling"""
    
    def __init__(self, db: Database):
        self.db = db
    
    def create(self, session_id: str, ip_address: str, user_agent: str) -> Dict[str, Any]:
        """Create a new session with initial activity timestamp"""
        with self.db.get_connection() as conn:
            # Check if last_activity column exists
            cursor = conn.execute("PRAGMA table_info(sessions)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'last_activity' in columns:
                conn.execute(
                    """INSERT INTO sessions (id, ip_address, user_agent, status, last_activity)
                       VALUES (?, ?, ?, 'in_progress', CURRENT_TIMESTAMP)""",
                    (session_id, ip_address, user_agent)
                )
            else:
                conn.execute(
                    """INSERT INTO sessions (id, ip_address, user_agent, status)
                       VALUES (?, ?, ?, 'in_progress')""",
                    (session_id, ip_address, user_agent)
                )
        return self.get(session_id)
    
    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID with formatted timestamps"""
        with self.db.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM sessions WHERE id = ?",
                (session_id,)
            )
            row = cursor.fetchone()
            if row:
                data = dict(row)
                # Apply shared formatting logic
                if 'created_at' in data:
                    data['created_at'] = format_timestamp_iso(data['created_at'])
                if 'last_updated' in data:
                    data['last_updated'] = format_timestamp_iso(data['last_updated'])
                if 'last_activity' in data:
                    data['last_activity'] = format_timestamp_iso(data['last_activity'])
                return data
            return None
    
    def update_status(self, session_id: str, status: str):
        """Update session status"""
        with self.db.get_connection() as conn:
            conn.execute(
                """UPDATE sessions 
                   SET status = ?, last_updated = CURRENT_TIMESTAMP
                   WHERE id = ?""",
                (status, session_id)
            )
    
    def update_activity(self, session_id: str):
        """Update last_activity timestamp - called on every interaction"""
        with self.db.get_connection() as conn:
            # Check if last_activity column exists
            cursor = conn.execute("PRAGMA table_info(sessions)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'last_activity' in columns:
                conn.execute(
                    """UPDATE sessions 
                       SET last_activity = CURRENT_TIMESTAMP, 
                           last_updated = CURRENT_TIMESTAMP 
                       WHERE id = ?""",
                    (session_id,)
                )
            else:
                conn.execute(
                    """UPDATE sessions 
                       SET last_updated = CURRENT_TIMESTAMP 
                       WHERE id = ?""",
                    (session_id,)
                )
    
    def touch(self, session_id: str):
        """Alias for update_activity"""
        self.update_activity(session_id)
    
    def delete(self, session_id: str):
        """Delete a session (cascade deletes answers)"""
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    
    def cleanup_stale(self, minutes: int = 5) -> int:
        """Delete sessions inactive for X minutes (in_progress only)"""
        with self.db.get_connection() as conn:
            # Check if last_activity column exists
            cursor = conn.execute("PRAGMA table_info(sessions)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'last_activity' in columns:
                conn.execute(
                    """DELETE FROM sessions 
                       WHERE status = 'in_progress' 
                       AND datetime(last_activity) < datetime('now', '-' || ? || ' minutes')""",
                    (minutes,)
                )
            else:
                conn.execute(
                    """DELETE FROM sessions 
                       WHERE status = 'in_progress' 
                       AND datetime(last_updated) < datetime('now', '-' || ? || ' minutes')""",
                    (minutes,)
                )
            return conn.total_changes
    
    def cleanup_abandoned(self, minutes: int = 30) -> int:
        """Legacy method - now calls cleanup_stale"""
        return self.cleanup_stale(minutes)
    
    def list_all(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """List all sessions with formatted timestamps"""
        with self.db.get_connection() as conn:
            # Check if session_summary view exists
            cursor = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='view' AND name='session_summary'"
            )
            view_exists = cursor.fetchone()
            
            if view_exists:
                cursor = conn.execute(
                    """SELECT * FROM session_summary 
                       ORDER BY created_at DESC LIMIT ? OFFSET ?""",
                    (limit, offset)
                )
            else:
                cursor = conn.execute(
                    """SELECT * FROM sessions 
                       ORDER BY created_at DESC LIMIT ? OFFSET ?""",
                    (limit, offset)
                )
            
            sessions = []
            for row in cursor.fetchall():
                data = dict(row)
                # Apply shared formatting logic
                if 'created_at' in data:
                    data['created_at'] = format_timestamp_iso(data['created_at'])
                if 'last_updated' in data:
                    data['last_updated'] = format_timestamp_iso(data['last_updated'])
                if 'last_activity' in data:
                    data['last_activity'] = format_timestamp_iso(data['last_activity'])
                sessions.append(data)
            return sessions
    
    def count(self) -> int:
        """Count total sessions"""
        with self.db.get_connection() as conn:
            cursor = conn.execute("SELECT COUNT(*) as count FROM sessions")
            return cursor.fetchone()['count']


class Answer:
    """Answer model with question text storage"""
    
    def __init__(self, db: Database):
        self.db = db
    
    def save(self, session_id: str, question_id: str, answer_text: str, question_text: str = ""):
        """Save or update an answer WITH question text"""
        with self.db.get_connection() as conn:
            # Check if question_text column exists
            cursor = conn.execute("PRAGMA table_info(answers)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'question_text' in columns:
                conn.execute(
                    """INSERT INTO answers (session_id, question_id, question_text, answer_text)
                       VALUES (?, ?, ?, ?)
                       ON CONFLICT(session_id, question_id) 
                       DO UPDATE SET 
                           answer_text = excluded.answer_text,
                           question_text = excluded.question_text,
                           created_at = CURRENT_TIMESTAMP""",
                    (session_id, question_id, question_text, answer_text)
                )
            else:
                conn.execute(
                    """INSERT INTO answers (session_id, question_id, answer_text)
                       VALUES (?, ?, ?)
                       ON CONFLICT(session_id, question_id) 
                       DO UPDATE SET 
                           answer_text = excluded.answer_text,
                           created_at = CURRENT_TIMESTAMP""",
                    (session_id, question_id, answer_text)
                )
    
    def get_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all answers for a session with question text AND formatted timestamp"""
        with self.db.get_connection() as conn:
            # Check if question_text column exists
            cursor = conn.execute("PRAGMA table_info(answers)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'question_text' in columns:
                cursor = conn.execute(
                    """SELECT id, question_id, question_text, answer_text, created_at
                       FROM answers WHERE session_id = ?
                       ORDER BY created_at""",
                    (session_id,)
                )
            else:
                cursor = conn.execute(
                    """SELECT question_id, answer_text, created_at
                       FROM answers WHERE session_id = ?
                       ORDER BY created_at""",
                    (session_id,)
                )
            
            # FIX: Iterate and format timestamps for answers too!
            answers = []
            for row in cursor.fetchall():
                data = dict(row)
                if 'created_at' in data:
                    data['created_at'] = format_timestamp_iso(data['created_at'])
                answers.append(data)
            return answers
    
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