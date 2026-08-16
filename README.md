# ScoutMind

**Autonomous AI research engine that investigates topics, discovers opportunities, and generates startup ideas — visualized as a live interactive graph.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-ScoutMind-FF8A00?style=for-the-badge&logo=googlechrome&logoColor=white)](https://scoutmind-frontend-rg8v.onrender.com/)

---

## What is ScoutMind?

ScoutMind is not a chatbot. It's an autonomous investigation engine.

Enter a topic, and the AI independently plans research questions, searches the web, extracts insights, discovers business opportunities, and generates scored startup ideas — all streamed live as an interactive graph.

### How It Works

1. **Enter a topic** — "AI opportunities in mental health"
2. **AI creates a research plan** — breaks it into focused questions
3. **AI performs web research** — searches the web for each question
4. **AI extracts insights** — synthesizes findings, competitors, statistics, pain points
5. **AI discovers opportunities** — identifies business gaps from research
6. **AI generates startup ideas** — creates scored startup concepts
7. **Live graph visualization** — watch every step unfold in real-time

### Key Features

- **Autonomous multi-step research pipeline** — no human intervention needed
- **Live graph visualization** — real-time node/edge graph as investigation progresses
- **Multi-provider LLM routing** — OpenRouter, Gemini, Groq with automatic fallback
- **Structured scoring** — startup ideas scored on market, feasibility, and innovation
- **PDF export** — download the full research report
- **Authentication** — email/password + Google OAuth sign-in
- **Investigation history** — all past investigations saved and accessible from dashboard

---

## Live Demo

**Try it now:** [https://scoutmind-frontend-rg8v.onrender.com/](https://scoutmind-frontend-rg8v.onrender.com/)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4, React Flow, jsPDF |
| **Backend** | FastAPI, Python 3.12, LangGraph |
| **LLM Providers** | OpenRouter (default), Google Gemini, Groq |
| **Search** | Tavily API |
| **Database** | MySQL 8.0 (Aiven), SQLAlchemy |
| **Auth** | Google OAuth 2.0 + email/password, PyJWT |
| **Deployment** | Render (Docker), MySQL on Aiven |

---

## Architecture

```
scoutMind/
├── frontend/                    # Next.js 15 (standalone Docker)
│   └── src/
│       ├── app/                 # Routes (login, register, dashboard, etc.)
│       ├── components/          # React components
│       │   ├── investigation/   # Live graph + pipeline UI
│       │   ├── report/          # Report page with PDF export
│       │   └── layout/          # Header, logo, nav
│       ├── lib/                 # API client, auth context
│       └── providers/           # Investigation context
├── backend/                     # FastAPI + LangGraph
│   └── app/
│       ├── api/                 # REST endpoints (auth, investigations)
│       ├── auth/                # JWT, password hashing, dependencies
│       ├── models/              # SQLAlchemy models
│       ├── providers/           # LLM provider abstraction
│       │   ├── base_provider.py
│       │   ├── openrouter_provider.py
│       │   ├── gemini_provider.py
│       │   └── groq_provider.py
│       ├── services/
│       │   ├── investigation.py # Orchestrator
│       │   └── research/
│       │       ├── planner.py
│       │       ├── research_loop.py
│       │       ├── insight_extractor.py
│       │       ├── opportunity_finder.py
│       │       ├── startup_generator.py
│       │       └── report_generator.py
│       ├── workflow/
│       │   ├── state.py         # InvestigationState TypedDict
│       │   └── graph.py         # LangGraph pipeline
│       └── repositories/        # Data access layer
├── render.yaml                  # Render deployment config
└── README.md
```

---

## LLM Model Routing

Each stage of the pipeline is independently configurable:

| Stage | Default Provider | Configurable Via |
|-------|-----------------|------------------|
| Research Planner | OpenRouter | `LLM_PLANNER` |
| Insight Extraction | OpenRouter | `LLM_INSIGHTS` |
| Opportunity Finder | OpenRouter | `LLM_OPPORTUNITIES` |
| Startup Generator | OpenRouter | `LLM_STARTUPS` |
| Report Generator | OpenRouter | `LLM_REPORT` |

Set any of these to `gemini`, `groq`, or `openrouter` to change the provider for that stage. Automatic fallback kicks in on failure.

---

## Retry & Fallback

- **3 retries** with exponential backoff on every LLM call
- **Automatic provider fallback**: OpenRouter → Gemini → Groq
- Search failures: mark question as failed, continue investigation

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.12+
- Node.js 20+
- MySQL 8.0
- API keys: OpenRouter (or Gemini/Groq), Tavily
- Google Cloud OAuth credentials (for Google login)

### 1. Create MySQL Database

```sql
CREATE DATABASE scoutmind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'scoutmind'@'localhost' IDENTIFIED BY 'scoutmind_secret';
GRANT ALL PRIVILEGES ON scoutmind.* TO 'scoutmind'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configure Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://scoutmind:scoutmind_secret@localhost:3306/scoutmind
OPENROUTER_API_KEY=your_openrouter_key
TAVILY_API_KEY=your_tavily_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CORS_ORIGINS=http://localhost:3000
```

### 3. Start Backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Configure Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 5. Start Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | MySQL connection URL (`mysql+pymysql://...`) |
| `OPENROUTER_API_KEY` | Yes* | — | OpenRouter API key |
| `GEMINI_API_KEY` | No | — | Google Gemini API key (if using Gemini) |
| `GROQ_API_KEY` | No | — | Groq API key (if using Groq) |
| `TAVILY_API_KEY` | Yes | — | Tavily search API key |
| `JWT_SECRET` | Yes | — | Secret for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `LLM_PLANNER` | No | `openrouter` | Provider for research planning |
| `LLM_INSIGHTS` | No | `openrouter` | Provider for insight extraction |
| `LLM_OPPORTUNITIES` | No | `openrouter` | Provider for opportunity discovery |
| `LLM_STARTUPS` | No | `openrouter` | Provider for startup generation |
| `LLM_REPORT` | No | `openrouter` | Provider for report generation |

\* At least one LLM provider key is required.

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g. `https://scoutmind-backend.onrender.com`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth client ID for Google sign-in |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register with email/password |
| `POST` | `/api/auth/login` | No | Login with email/password |
| `POST` | `/api/auth/google` | No | Login with Google ID token |
| `POST` | `/api/auth/google-code` | No | Login with Google OAuth code |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `POST` | `/api/investigations` | Yes | Create new investigation |
| `GET` | `/api/investigations` | Yes | List all investigations |
| `GET` | `/api/investigations/{id}` | Yes | Get investigation details |
| `GET` | `/api/investigations/{id}/graph` | Yes | Get graph nodes & edges |
| `GET` | `/api/investigations/{id}/report` | Yes | Get final report & startup ideas |
| `DELETE` | `/api/investigations/{id}` | Yes | Delete investigation |
| `GET` | `/health` | No | Health check |

---

## Startup Idea Scoring

Each generated startup idea is scored across three dimensions (0-10 each):

| Dimension | Measures |
|-----------|----------|
| **Market Score** | Market size, growth potential, timing |
| **Feasibility Score** | Technical and business feasibility |
| **Innovation Score** | Novelty and differentiation |
| **Total Score** | Sum of all three (0-30) |

Ideas are ranked by total score in the final report.

---

## Deployment

Deployed on **Render** with Docker:

- **Frontend**: `https://scoutmind-frontend-rg8v.onrender.com/`
- **Backend**: `https://scoutmind-backend.onrender.com`
- **Database**: MySQL 8.0 on Aiven

To deploy your own instance, see `render.yaml` for the service configuration.

---

## License

MIT License
