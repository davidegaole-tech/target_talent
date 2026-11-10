from __future__ import annotations

from fastapi import APIRouter, Depends

from ..schemas import SettingsIn
from ..services import Services, configured_model, get_services, resolve_model

router = APIRouter(prefix="/api")


@router.get("/health")
async def health(s: Services = Depends(get_services)) -> dict:
    st = await resolve_model(s)
    return {
        "ollama": st.ollama,
        "model": st.model,
        "configured_model": st.configured,
        "model_installed": st.installed,
        "warning": st.warning,
        "num_ctx": s.config.num_ctx,
    }


@router.get("/models")
async def models(s: Services = Depends(get_services)) -> dict:
    return {"models": await s.client.list_models(), "current": configured_model(s)}


@router.get("/settings")
async def get_settings(s: Services = Depends(get_services)) -> dict:
    return {"model": configured_model(s)}


@router.put("/settings")
async def put_settings(body: SettingsIn, s: Services = Depends(get_services)) -> dict:
    s.db.set_setting("model", body.model.strip())
    return {"model": configured_model(s)}
