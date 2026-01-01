# Lola Discovery Chatbot

A production-ready, rule-based business discovery chatbot built with React (Vite) and Flask.

## Features

- ✅ Deterministic rule-based logic (no LLMs/AI APIs)
- ✅ 12-question business discovery flow
- ✅ Chat-style conversational UI
- ✅ Progress tracking and session persistence
- ✅ Input validation and error handling
- ✅ Admin dashboard with export functionality
- ✅ Docker-ready deployment
- ✅ Comprehensive test coverage

## Tech Stack

**Frontend:** Vite + React + React Router  
**Backend:** Python Flask + SQLite  
**Deployment:** Docker + Docker Compose

## Quick Start

### Local Development

**Backend:**
cd backend
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
python run.py



**Frontend:**
cd frontend
npm install
npm run dev



Visit: http://localhost:5173

### Docker Deployment

Build and run
docker-compose up --build

Access
Frontend: http://localhost
Backend: http://localhost:5000



## Project Structure

lola-discovery-chatbot/
├── backend/ # Flask API
├── frontend/ # React SPA
├── docker-compose.yml
└── README.md



## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/session/start` | POST | Start new session |
| `/session/{id}/answer` | POST | Submit answer |
| `/session/{id}/summary` | GET | Get responses |
| `/admin/responses` | GET | List all sessions |
| `/admin/export?format=csv` | GET | Export data |

## Testing

cd backend
pytest tests/ -v



## Environment Variables

See `.env.example` for required configuration.

## Production Deployment

1. Set strong `SECRET_KEY` in production
2. Use PostgreSQL instead of SQLite for scale
3. Enable HTTPS with SSL certificates
4. Set `FLASK_ENV=production`
5. Configure proper CORS origins

## License

MIT