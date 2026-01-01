-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    ip_address TEXT,
    user_agent TEXT,
    timezone TEXT,
    locale TEXT DEFAULT 'en-US',
    CHECK (status IN ('pending', 'in_progress', 'completed', 'abandoned'))
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE(session_id, question_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- Create view for easy querying
CREATE VIEW IF NOT EXISTS session_summary AS
SELECT 
    s.id,
    s.status,
    s.created_at,
    s.last_updated,
    COUNT(a.id) as answers_count,
    s.ip_address
FROM sessions s
LEFT JOIN answers a ON s.id = a.session_id
GROUP BY s.id;
