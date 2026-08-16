import threading
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_store: dict[str, dict] = {}
_cleanup_timers: dict[str, float] = {}

CLEANUP_DELAY_SECONDS = 60.0


def create_investigation(inv_id: str, problem_statement: str) -> str:
    with _lock:
        _store[inv_id] = {
            "id": inv_id,
            "problem_statement": problem_statement,
            "status": "pending",
            "events": [],
            "report": None,
            "project_ideas": [],
            "error": None,
        }
    return inv_id


def get_investigation(inv_id: str) -> Optional[dict]:
    with _lock:
        return _store.get(inv_id)


def update_status(inv_id: str, status: str):
    with _lock:
        if inv_id in _store:
            _store[inv_id]["status"] = status


def add_event(inv_id: str, event_type: str, message: str, metadata: Optional[dict] = None) -> dict:
    with _lock:
        if inv_id not in _store:
            raise KeyError(f"Investigation {inv_id} not found")
        inv = _store[inv_id]
        event = {
            "id": len(inv["events"]) + 1,
            "investigation_id": inv_id,
            "event_type": event_type,
            "message": str(message)[:500],
            "metadata": metadata,
        }
        inv["events"].append(event)
        return event


def get_events(inv_id: str) -> list[dict]:
    with _lock:
        if inv_id not in _store:
            return []
        return list(_store[inv_id]["events"])


def set_report(inv_id: str, report: dict, project_ideas: list[dict]):
    normalized_report = {}
    text_fields = [
        "spark_summary", "research_findings", "recommended_project",
        "suggested_mvp", "future_expansion", "root_cause_analysis",
        "existing_solutions", "market_gaps", "risks", "references",
        "key_pain_points",
    ]
    for k, v in report.items():
        if k in text_fields:
            if isinstance(v, list):
                normalized_report[k] = v
            else:
                normalized_report[k] = str(v) if v else ""
        else:
            normalized_report[k] = v
    with _lock:
        if inv_id in _store:
            _store[inv_id]["report"] = normalized_report
            _store[inv_id]["project_ideas"] = project_ideas


def get_report(inv_id: str) -> Optional[dict]:
    inv = _store.get(inv_id)
    if not inv:
        return None
    return {
        "report": inv.get("report"),
        "project_ideas": inv.get("project_ideas", []),
    }


def schedule_cleanup(inv_id: str):
    import threading as _threading
    _cleanup_timers[inv_id] = CLEANUP_DELAY_SECONDS

    def _do_cleanup():
        import time
        time.sleep(CLEANUP_DELAY_SECONDS)
        remove_investigation(inv_id)
        logger.info(f"Cleaned up investigation {inv_id}")

    t = _threading.Thread(target=_do_cleanup, daemon=True)
    t.start()


def remove_investigation(inv_id: str):
    with _lock:
        _store.pop(inv_id, None)
        _cleanup_timers.pop(inv_id, None)
