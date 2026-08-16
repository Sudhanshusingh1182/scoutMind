import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    gemini_api_key: str = ""
    groq_api_key: str = ""
    openrouter_api_key: str = ""

    openrouter_model: str = "nvidia/nemotron-3-ultra-550b-a55b:free"

    llm_planner: str = "openrouter"
    llm_insights: str = "openrouter"
    llm_opportunities: str = "openrouter"
    llm_startups: str = "openrouter"
    llm_report: str = "openrouter"

    tavily_api_key: str = ""

    # Database
    database_url: str = "mysql+pymysql://scoutmind:scoutmind_secret@localhost:3306/scoutmind"

    # JWT
    jwt_secret: str = "scoutmind-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"

    # Google OAuth
    google_client_id: str = ""

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # CORS
    cors_origins: str = "http://localhost:3000"

    max_research_questions: int = 5
    max_search_results: int = 5
    max_insights: int = 5
    max_pain_points: int = 5
    max_root_causes: int = 5
    max_existing_solutions: int = 4
    max_market_gaps: int = 4
    max_competitors: int = 3
    max_opportunities: int = 3
    max_project_ideas: int = 5

    enable_early_stopping: bool = True
    evidence_sufficiency_threshold: int = 6
    evidence_relevance_min: float = 0.5

    class Config:
        env_file = os.getenv("SCOUTMIND_ENV_FILE", str(Path(__file__).resolve().parent.parent / ".env"))
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
