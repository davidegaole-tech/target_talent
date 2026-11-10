"""Accesso provvisorio con credenziali fisse (configurabili con TALENT_USER e TALENT_PASSWORD).

Non è ancora una protezione vera: l'app gira in locale e le API restano aperte.
Verrà sostituito quando ci sarà il database degli utenti.
"""
from __future__ import annotations

import hmac

from fastapi import APIRouter, Depends

from ..errors import AppError
from ..schemas import LoginRequest
from ..services import Services, get_services

router = APIRouter(prefix="/api")


@router.post("/login")
def login(body: LoginRequest, s: Services = Depends(get_services)) -> dict:
    ok_user = hmac.compare_digest(body.username.strip().encode(), s.config.login_user.encode())
    ok_pass = hmac.compare_digest(body.password.encode(), s.config.login_password.encode())
    if not (ok_user and ok_pass):
        raise AppError("invalid_credentials", "Nome utente o password non corretti.", 401)
    return {"ok": True, "user": s.config.login_user}
