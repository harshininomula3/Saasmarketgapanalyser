# SaaS Market Gap Analyzer — Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (running locally)
- Anthropic API key

---

## 1. PostgreSQL Setup

```sql
-- Run in psql:
CREATE DATABASE gap_analyzer;
```

Then set your credentials in `backend/.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/gap_analyzer
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 2. Backend Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend will auto-initialize the DB schema and seed competitor data on first run.

---

## 3. Frontend Setup

```powershell
cd frontend
npm start
```

Opens at http://localhost:3000

---

## 4. Usage

1. **Open** http://localhost:3000
2. Go to **Run Analysis** tab
3. Upload `sample_data/survey_pain_points.csv` (or your own CSV)
4. Click **Upload CSV** → then **Run Full Analysis**
5. View results in **Dashboard**, **Gaps**, and **Opportunities** tabs

---

## CSV Format

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| theme | text | ✅ | Max 200 chars, must be unique |
| description | text | ✅ | Min 10 chars |
| frequency | int | ✅ | Must be > 0 |
| severity_score | float | ✅ | 0.0 – 10.0 |
| affected_personas | text | optional | Comma-separated: "CFO,Finance Manager" |
| related_keywords | text | optional | Comma-separated: "receipt,ocr" |
| source | text | optional | Default: "survey" |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/upload-csv | Upload pain point CSV |
| POST | /api/analyze | Run full AI pipeline |
| GET | /api/dashboard | Dashboard summary |
| GET | /api/pain-points | List all pain points |
| GET | /api/competitors | List competitors + features |
| GET | /api/gaps | List identified gaps |
| GET | /api/opportunities?limit=N | List scored opportunities |
| DELETE | /api/reset | Clear all analysis data |

Interactive docs: http://localhost:8000/docs
