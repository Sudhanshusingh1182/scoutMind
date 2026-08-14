import json
import logging
import asyncio
from fastapi import WebSocket
from typing import Optional

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, investigation_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            if investigation_id not in self._connections:
                self._connections[investigation_id] = []
            self._connections[investigation_id].append(websocket)
        logger.info(f"WebSocket connected for investigation {investigation_id}")

    async def disconnect(self, investigation_id: str, websocket: WebSocket):
        async with self._lock:
            conns = self._connections.get(investigation_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._connections.pop(investigation_id, None)
        logger.info(f"WebSocket disconnected for investigation {investigation_id}")

    async def send_event(self, investigation_id: str, event: dict):
        async with self._lock:
            conns = self._connections.get(investigation_id, [])
            if not conns:
                return
            dead = []
            for ws in conns:
                try:
                    await ws.send_json(event)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                conns.remove(ws)
            if not conns:
                self._connections.pop(investigation_id, None)

    async def broadcast_step_update(self, investigation_id: str, step_data: dict):
        await self.send_event(investigation_id, {
            "type": "step_update",
            "step": step_data,
        })

    async def broadcast_event(self, investigation_id: str, event_type: str, message: str, metadata: dict | None = None):
        await self.send_event(investigation_id, {
            "type": "event",
            "event": {
                "event_type": event_type,
                "message": message,
                "metadata": metadata,
            },
        })

    async def broadcast_status(self, investigation_id: str, status: str, progress: int | None = None):
        await self.send_event(investigation_id, {
            "type": "status",
            "status": status,
            "progress": progress,
        })

    async def broadcast_summary(self, investigation_id: str, summary: dict):
        await self.send_event(investigation_id, {
            "type": "summary",
            "summary": summary,
        })

    async def broadcast_report_section(self, investigation_id: str, section_key: str, section_data):
        await self.send_event(investigation_id, {
            "type": "report_section",
            "section_key": section_key,
            "section_data": section_data,
        })

    async def broadcast_artifact_count(self, investigation_id: str, artifact_type: str, count: int, detail: str = ""):
        await self.send_event(investigation_id, {
            "type": "artifact_count",
            "artifact_type": artifact_type,
            "count": count,
            "detail": detail,
        })


ws_manager = ConnectionManager()
