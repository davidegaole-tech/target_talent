"""Account utente: registrazione, login, sessioni e salvataggio dello stato."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Query

from ..errors import AppError
from ..schemas import LoginRequest, RegisterRequest, StatePayload
from ..security import hash_password, new_token, verify_password
from ..services import Services, get_services

router = APIRouter(prefix="/api")
SESSION_TTL_MS = 30 * 24 * 3600 * 1000  # 30 giorni


def _public(user: dict) -> dict:
    return {
        key: user.get(key)
        for key in ("id", "username", "email", "role", "display_name", "created_at", "last_login_at")
    }


def current_user(
    authorization: str | None = Header(default=None),
    s: Services = Depends(get_services),
) -> dict:
    """Utente autenticato tramite `Authorization: Bearer <token>`."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError("unauthorized", "Accedi per continuare.", 401)
    token = authorization.split(" ", 1)[1].strip()
    session = s.db.get_session(token)
    if not session:
        raise AppError("unauthorized", "Sessione scaduta: accedi di nuovo.", 401)
    user = s.db.get_user(session["user_id"])
    if not user:
        raise AppError("unauthorized", "Utente non trovato.", 401)
    return {**user, "_token": token}


def current_user_optional(
    authorization: str | None = Header(default=None),
    s: Services = Depends(get_services),
) -> dict | None:
    """Come ``current_user`` ma senza errore: None se il token manca o è scaduto.

    Serve alle route che funzionano anche senza login (schede, documenti) ma che
    devono isolare i dati quando l'utente è autenticato.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    session = s.db.get_session(token)
    if not session:
        return None
    user = s.db.get_user(session["user_id"])
    return {**user, "_token": token} if user else None


def current_user_file(
    t: str | None = Query(default=None),
    authorization: str | None = Header(default=None),
    s: Services = Depends(get_services),
) -> dict:
    """Utente per i file aperti con un link diretto (es. <img src>).

    Il token può arrivare come ``?t=`` oppure come header Bearer: senza sessione
    il file non si apre, anche conoscendo l'URL.
    """
    token = t or ""
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    session = s.db.get_session(token) if token else None
    user = s.db.get_user(session["user_id"]) if session else None
    if not user:
        raise AppError("unauthorized", "Accedi per aprire questo file.", 401)
    return user


def _issue(s: Services, user: dict) -> dict:
    token = new_token()
    s.db.create_session(user["id"], token, SESSION_TTL_MS)
    s.db.touch_login(user["id"])
    return {"ok": True, "token": token, "user": _public(user)}


def _ensure_demo_user(s: Services) -> dict:
    user = s.db.get_user_by_username(s.config.login_user)
    if user:
        return user
    return s.db.create_user(
        s.config.login_user,
        hash_password(s.config.login_password),
        "studente",
        "Demo",
    )


@router.post("/auth/register")
def register(body: RegisterRequest, s: Services = Depends(get_services)) -> dict:
    username = body.username.strip()
    if len(username) < 3:
        raise AppError("invalid_username", "Il nome utente deve avere almeno 3 caratteri.", 400)
    if s.db.get_user_by_username(username):
        raise AppError("username_taken", "Nome utente già in uso.", 409)

    nome = (body.first_name or "").strip()
    cognome = (body.last_name or "").strip()
    display_name = body.display_name or " ".join(x for x in (nome, cognome) if x) or username
    email = (body.email or "").strip() or None

    user = s.db.create_user(
        username,
        hash_password(body.password),
        body.role,
        display_name,
        email,
    )

    # I dati personali raccolti nel modulo di registrazione finiscono subito
    # nel profilo: la sezione "Il mio profilo" resta per le modifiche.
    profilo = {
        "nome": nome,
        "cognome": cognome,
        "nascita": (body.birth_date or "").strip(),
        "citta": (body.city or "").strip(),
        "email": email or "",
        "scuola": (body.school or "").strip(),
        "classe": (body.class_name or "").strip(),
    }
    if any(profilo.values()):
        try:
            s.db.save_profile(user["id"], {k: v for k, v in profilo.items() if v})
        except Exception:  # pragma: no cover - il profilo non deve bloccare l'accesso
            pass

    return _issue(s, user)


@router.post("/auth/login")
def login(body: LoginRequest, s: Services = Depends(get_services)) -> dict:
    username = body.username.strip()
    user = s.db.get_user_by_username(username)
    if user is None and username.lower() == s.config.login_user.lower() and body.password == s.config.login_password:
        # Compatibilità con le credenziali demo della configurazione.
        _ensure_demo_user(s)
        user = s.db.get_user_by_username(username)
    if user is None or not verify_password(body.password, user.get("password_hash")):
        raise AppError("invalid_credentials", "Nome utente o password non corretti.", 401)
    return _issue(s, user)


@router.post("/auth/logout")
def logout(user: dict = Depends(current_user), s: Services = Depends(get_services)) -> dict:
    s.db.delete_session(user["_token"])
    return {"ok": True}


@router.get("/auth/me")
def me(user: dict = Depends(current_user)) -> dict:
    return {"user": _public(user)}


@router.get("/state")
def get_state(user: dict = Depends(current_user), s: Services = Depends(get_services)) -> dict:
    return {"state": s.db.get_state(user["id"]), "user": _public(user)}


@router.put("/state")
def put_state(
    body: StatePayload,
    user: dict = Depends(current_user),
    s: Services = Depends(get_services),
) -> dict:
    s.db.save_state(user["id"], body.state)
    return {"ok": True}


@router.delete("/state")
def delete_state(user: dict = Depends(current_user), s: Services = Depends(get_services)) -> dict:
    s.db.delete_state(user["id"])
    return {"ok": True}
