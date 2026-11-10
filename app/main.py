"""Punto di ingresso FastAPI: monta i file statici e registra le route."""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import Config, load_config
from .db import Database
from .errors import AppError
from .ollama_client import LLMClient, OllamaClient
from .routes import analyze, chat, generate, items, system
from .services import Services


def create_app(config: Config | None = None, client: LLMClient | None = None, db: Database | None = None) -> FastAPI:
    config = config or load_config()
    app = FastAPI(title="Talent Passport", docs_url="/api/docs", openapi_url="/api/openapi.json")
    app.state.services = Services(
        config=config,
        db=db or Database(config.db_path),
        client=client or OllamaClient(config.ollama_url),
    )

    @app.exception_handler(AppError)
    async def _app_error(_: Request, e: AppError) -> JSONResponse:
        return JSONResponse(e.to_dict(), status_code=e.status)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, e: RequestValidationError) -> JSONResponse:
        return JSONResponse({"error": {"code": "invalid_request", "message": "Richiesta non valida.",
                                       "details": str(e.errors()[:3])}}, status_code=422)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, e: StarletteHTTPException) -> JSONResponse:
        msg = "Pagina non trovata." if e.status_code == 404 else "Richiesta non valida."
        return JSONResponse({"error": {"code": f"http_{e.status_code}", "message": msg}}, status_code=e.status_code)

    @app.middleware("http")
    async def _no_stale_static(request: Request, call_next):  # type: ignore[no-untyped-def]
        """I file della pagina vanno sempre ricontrollati (ETag), così un aggiornamento si vede subito."""
        response = await call_next(request)
        if not request.url.path.startswith("/api/"):
            response.headers.setdefault("Cache-Control", "no-cache")
        return response

    for r in (system.router, items.router, generate.router, chat.router, analyze.router):
        app.include_router(r)
    app.mount("/", StaticFiles(directory=config.web_dir, html=True), name="web")
    return app


def get_app() -> FastAPI:
    """Factory per uvicorn (--factory)."""
    return create_app()
