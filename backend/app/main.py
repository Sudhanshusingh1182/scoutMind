import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.router import router as api_router
from app.websocket_manager import ws_manager
from app.auth.jwt import decode_access_token

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="ScoutMind API",
    description="AI Project Opportunity Discovery Engine",
    version="4.0.0",
)

cors_origins = [origin.strip().rstrip("/") for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
def create_tables():
    import app.models  # noqa: F401 — ensures all models are registered with Base
    from app.database.engine import engine
    from app.database.base import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "scoutmind"}


@app.websocket("/ws/investigation/{investigation_id}")
async def investigation_websocket(websocket: WebSocket, investigation_id: str, token: str = Query(...)):
    try:
        user_id = decode_access_token(token)
        if user_id is None:
            await websocket.close(code=4001, reason="Invalid token")
            return
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await ws_manager.connect(investigation_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        await ws_manager.disconnect(investigation_id, websocket)
    except Exception:
        await ws_manager.disconnect(investigation_id, websocket)
