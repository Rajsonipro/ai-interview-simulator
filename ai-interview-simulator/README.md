# 🎯 AI Interview Simulator

A full-stack AI-powered mock interview web application that generates domain-specific questions, records voice answers via Web Speech API, evaluates responses using LLM AI, and provides detailed performance analytics.

---

## 📁 Project Structure

```
ai-interview-simulator/
├── backend/                        # Python FastAPI
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── database/
│   │   │   └── db.py               # SQLite init & connection
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── auth.py             # /api/auth (register, login)
│   │   │   ├── interview.py        # /api/interview (session, evaluate)
│   │   │   └── report.py          # /api/report (session report, stats)
│   │   └── services/
│   │       ├── auth_service.py     # JWT + password hashing
│   │       └── ai_service.py       # OpenAI + fallback logic
│   ├── requirements.txt
│   ├── .env.example
│   └── run.sh
│
└── frontend/                       # React.js
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js                  # Root component + routing
    │   ├── index.js
    │   ├── index.css               # Global styles (dark theme)
    │   ├── context/
    │   │   └── AuthContext.js      # Auth state management
    │   ├── services/
    │   │   └── api.js              # Axios API client
    │   ├── components/
    │   │   └── Navbar.js
    │   └── pages/
    │       ├── AuthPage.js         # Login / Register
    │       ├── Dashboard.js        # Domain & difficulty selection
    │       ├── InterviewPage.js    # Voice recording + evaluation
    │       ├── ReportPage.js       # Charts + detailed report
    │       └── HistoryPage.js      # Past sessions
    ├── package.json
    └── .env
```

---

## 🚀 Setup & Running Locally

### Prerequisites
- Python 3.9+
- Node.js 16+ and npm
- (Optional) OpenAI API key

---

### Step 1 — Backend Setup

```bash
cd ai-interview-simulator/backend

# Create virtual environment
python -m venv venv

# Activate venv
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
cp .env.example .env
# Edit .env and add your OpenAI key (optional — app works without it)

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be running at: **http://localhost:8000**
API docs available at: **http://localhost:8000/docs**

---

### Step 2 — Frontend Setup

```bash
cd ai-interview-simulator/frontend

# Install dependencies
npm install

# Start the frontend
npm start
```

Frontend will be running at: **http://localhost:3000**

---

## 🔑 Environment Variables

### Backend `.env`
```env
OPENAI_API_KEY=sk-your-openai-api-key-here   # Optional — app uses fallback if missing
SECRET_KEY=your-secure-jwt-secret-key
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:8000
```

> **Note:** If you don't have an OpenAI API key, the app still works fully using intelligent fallback question banks and heuristic scoring. Add a real key for true AI evaluation.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Auth | Register/login with JWT tokens, passwords hashed with SHA-256 |
| 🎯 Dashboard | Select domain (Software Dev, HR, Marketing) and difficulty |
| 🤖 AI Questions | 5 dynamically generated questions via OpenAI GPT-3.5 |
| 🎤 Voice Recording | Browser Web Speech API with live transcription |
| ✨ AI Evaluation | Technical (0-100), Communication (0-100), Confidence (0-100) |
| 📊 Charts | Bar chart, Radar chart, Doughnut chart via Chart.js |
| 📋 History | Past sessions with scores |
| 🗣 Filler Words | Detects "um", "uh", "like", "you know", etc. |
| ⚡ WPM | Words-per-minute calculation |
| 💾 SQLite DB | All sessions, answers, scores saved locally |

---

## 🛠 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user, returns JWT |

### Interview
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/interview/session` | Create session + generate questions |
| POST | `/api/interview/evaluate` | Evaluate submitted answer |
| GET | `/api/interview/history/{user_id}` | Get user's past sessions |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/report/session/{session_id}` | Full session report with scores |
| GET | `/api/report/user/{user_id}/stats` | Aggregate user statistics |

---

## 📊 Evaluation Response Example

```json
{
  "technical_score": 78,
  "communication_score": 85,
  "confidence_score": 72,
  "overall_score": 78.3,
  "feedback": "Your answer demonstrates a solid understanding of the concept. Consider adding specific examples from past experience to strengthen your response.",
  "filler_words": 3,
  "filler_word_list": ["um", "like"],
  "words_per_minute": 142.5,
  "improvement_tips": [
    "Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
    "Reduce filler words by pausing instead of using 'um' or 'uh'",
    "Add quantifiable metrics to back up your claims"
  ]
}
```

---

## 🧠 How AI Works

1. **With OpenAI API Key:** Sends prompts to GPT-3.5-turbo for question generation and structured evaluation
2. **Without API Key (Fallback):** Uses curated question banks (15 questions × 3 levels × 3 domains = 135 questions) and heuristic scoring based on answer length, filler word count, and WPM

---

## 🎓 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Chart.js, Axios |
| Styling | Custom CSS (dark theme), Google Fonts |
| Speech | Web Speech API (browser-native) |
| Backend | Python FastAPI |
| Database | SQLite (no setup needed) |
| Auth | JWT (PyJWT) |
| AI | OpenAI GPT-3.5-turbo |

---

## 🐛 Troubleshooting

**CORS Error:** Make sure backend is running on port 8000 and frontend on 3000.

**Speech not working:** Use Chrome or Edge — Safari/Firefox have limited Web Speech API support.

**"Module not found" errors:** Run `pip install -r requirements.txt` in the backend venv and `npm install` in frontend.

**SQLite errors:** Delete `interview_simulator.db` and restart backend to reinitialize.

---

## 📝 License

MIT — Free to use for educational and personal projects.
