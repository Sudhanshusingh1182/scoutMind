# 🧠 ScoutMind

**Research opportunities. Discover startup ideas. Watch AI investigate.**

ScoutMind is an autonomous research engine that investigates a topic, discovers opportunities, and generates startup ideas — all while visualizing the entire investigation process as a live interactive graph.

---

## What is ScoutMind?

ScoutMind is **not** a chatbot. It's an autonomous investigation engine.

Enter a topic → Watch the AI research → See the graph grow → Get startup ideas.

### How It Works

1. **Enter a topic** — "AI opportunities in healthcare"
2. **AI creates a research plan** — breaks the topic into 5-10 focused questions
3. **AI performs web research** — searches Tavily for each question
4. **AI extracts insights** — synthesizes findings, competitors, statistics, pain points
5. **AI finds opportunities** — discovers business opportunities from research
6. **AI generates startup ideas** — creates scored startup concepts
7. **Live graph visualization** — watch every step unfold in real-time

---

## Architecture

```
scoutMind/
├── frontend/                    # Next.js 15 app
│   └── src/
│       ├── app/                 # Routes
│       ├── components/          # React components
│       ├── lib/                 # API client, types
│       └── providers/           # React context providers
├── backend/                     # FastAPI + LangGraph
│   └── app/
│       ├── api/                 # REST + WebSocket endpoints
│       ├── models/              # SQLAlchemy models
│       ├── schemas/             # Pydantic schemas
│       ├── providers/           # LLM provider abstraction
│       │   ├── base_provider.py # Abstract interface
│       │   ├── gemini_provider.py
│       │   └── groq_provider.py
│       ├── services/
│       │   ├── investigation.py # Orchestrator
│       │   ├── research/
│       │   │   ├── planner.py           # Research question generator
│       │   │   ├── research_loop.py     # Tavily search executor
│       │   │   ├── insight_extractor.py # Structured insight extraction
│       │   │   ├── opportunity_finder.py
│       │   │   ├── startup_generator.py
│       │   │   └── report_generator.py
│       │   └── search/
│       │       └── tavily_client.py     # Tavily search integration
│       └── workflow/
│           ├── state.py         # InvestigationState TypedDict
│           ├── graph.py         # LangGraph pipeline
│           └── retry.py         # Retry + fallback logic
├── .env.example
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React, TypeScript, Tailwind CSS v4, React Flow |
| **Backend** | FastAPI, Python 3.12, LangGraph |
| **AI Models** | Gemini 2.0 Flash (planning/reasoning), Groq Llama 3.3 (extraction) |
| **Search** | Tavily API |
| **Database** | MySQL 8.0, SQLAlchemy |
| **Real-time** | REST polling (3s interval) |

---

## Model Routing

| Stage | Provider | Model |
|-------|----------|-------|
| Research Planner | Gemini | gemini-2.0-flash |
| Insight Extraction | Groq | llama-3.3-70b-versatile |
| Pain Point Detection | Groq | llama-3.3-70b-versatile |
| Opportunity Finder | Gemini | gemini-2.0-flash |
| Startup Generator | Gemini | gemini-2.0-flash |
| Report Generator | Gemini | gemini-2.0-flash |

All configurable via environment variables.

---

## Retry & Fallback

Every LLM call supports:
- **3 retries** with exponential backoff
- **Automatic provider fallback**: Groq → Gemini, Gemini → Groq
- Tavily search failures: mark question as failed, continue investigation

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- MySQL 8.0 (running locally)
- API keys for: Gemini, Groq, Tavily

### 1. Create MySQL Database

```sql
CREATE DATABASE scoutmind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'scoutmind'@'localhost' IDENTIFIED BY 'scoutmind_secret';
GRANT ALL PRIVILEGES ON scoutmind.* TO 'scoutmind'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY, GROQ_API_KEY, TAVILY_API_KEY, and DATABASE_URL
```

### 3. Start the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open the App

Visit [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/investigations` | Create new investigation |
| `GET` | `/api/investigations` | List all investigations |
| `GET` | `/api/investigations/{id}` | Get investigation details |
| `GET` | `/api/investigations/{id}/graph` | Get graph nodes & edges |
| `GET` | `/api/investigations/{id}/report` | Get final report & startup ideas |
| `GET` | `/health` | Health check |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ | — | Google Gemini API key |
| `GROQ_API_KEY` | ✅ | — | Groq API key |
| `TAVILY_API_KEY` | ✅ | — | Tavily search API key |
| `DATABASE_URL` | ✅ | — | MySQL connection URL |
| `LLM_PLANNER` | ❌ | `gemini` | Provider for research planning |
| `LLM_INSIGHTS` | ❌ | `groq` | Provider for insight extraction |
| `LLM_OPPORTUNITIES` | ❌ | `gemini` | Provider for opportunity discovery |
| `LLM_STARTUPS` | ❌ | `gemini` | Provider for startup generation |
| `LLM_REPORT` | ❌ | `gemini` | Provider for report generation |
| `BACKEND_HOST` | ❌ | `0.0.0.0` | Server bind address |
| `BACKEND_PORT` | ❌ | `8000` | Server port |

---

## Startup Idea Scoring

Each generated startup idea is scored across three dimensions (each 0-10):

- **Market Score**: Market size, growth potential, timing
- **Feasibility Score**: Technical and business feasibility
- **Innovation Score**: Novelty and differentiation
- **Total Score**: Sum of all three scores (0-30)

Ideas are ranked by total score in the final report.

---

## License

MIT License
