from fastapi import APIRouter
from app.api.investigations import router as investigations_router
from app.api.auth import router as auth_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(investigations_router)
