import logging
import os
from datetime import datetime
from functools import lru_cache
import time 
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json

load_dotenv()

from M_app.M_Src_Backend import cruds, schemas
from M_app.M_Src_Backend.db import db_session, get_db, init_db
from M_app.M_Src_Backend.models import TodoItem, User
from M_app.M_Src_Backend.services.ai_helper.ai_helper_message_chat import MegaladoNNAIHelper
from M_app.M_Src_Backend.services.text_analyzer.ai_text_analyzer import MegaladoNNTranslator
from M_app.M_Src_Backend.services.text_analyzer.text_random_words import get_random_words


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("translator")

app = FastAPI(title="Reader-Overlay API", version="0.2.0")


allowed_origins_str = os.getenv("ALLOWED_ORIGINS", '["http://localhost:3000"]')
try:
    allowed_origins = json.loads(allowed_origins_str)
except json.JSONDecodeError:
    allowed_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logger(request, call_next):
    start = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        duration_ms = (time.perf_counter() - start) * 1000
        try:
            authorization = request.headers.get("authorization")
            token = _get_token_from_header(authorization)
            user_id = None
            with db_session() as db:
                if token:
                    session = cruds.get_session_by_token(db, token)
                    if session and not session.revoked and session.expires_at >= datetime.utcnow():
                        user_id = session.user_id
                cruds.create_request_log(
                    db,
                    user_id=user_id,
                    method=request.method,
                    path=request.url.path,
                    status_code=int(status_code),
                    ip=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent"),
                    duration_ms=duration_ms,
                    details={"query": str(request.url.query) if request.url.query else ""},
                )
        except Exception:
            logger.exception("Request logging failed")


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=100000)
    target_language: str = Field(min_length=2, max_length=32)


class TranslateResponse(BaseModel):
    translated_text: str
    target_language: str
    model: str


class RandomWordsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=100000)#api_key
    count: int = Field(ge=1, le=500)


class RandomWordsResponse(BaseModel):
    word_count: int
    random_words: list[str]


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)


class AssistantResponse(BaseModel):
    answer: str
    model: str


def build_translator(target_language: str) -> MegaladoNNTranslator:
    api_key = os.getenv("OPENROUTER_API_KEY", "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")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")
    model = os.getenv("TRANSLATION_MODEL", "tngtech/deepseek-r1t2-chimera:free")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    return MegaladoNNTranslator(
        api_key=api_key,
        target_language=target_language,
        model=model,
        base_url=base_url,
    )


@lru_cache(maxsize=64)
def get_translator(target_language: str) -> MegaladoNNTranslator:
    return build_translator(target_language)


def build_ai_helper() -> MegaladoNNAIHelper:
    api_key = "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"
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")
    model = os.getenv("AI_HELPER_MODEL", "tngtech/deepseek-r1t2-chimera:free")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    return MegaladoNNAIHelper(
        api_key=api_key,
        model=model,
        base_url=base_url,
    )


@lru_cache(maxsize=1)
def get_ai_helper() -> MegaladoNNAIHelper:
    return build_ai_helper()


def get_current_user(
    authorization: str | None = Header(None),
    db=Depends(get_db),
) -> User:
    token = _get_token_from_header(authorization)
    user = _get_user_from_token(token, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    return user


def _get_token_from_header(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    return authorization.replace("Bearer ", "").strip()


def _get_user_from_token(token: str | None, db) -> User | None:
    if not token:
        return None
    session = cruds.get_session_by_token(db, token)
    if session is None or session.revoked or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = cruds.get_user(db, session.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


def ensure_admin_account() -> None:
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    with db_session() as db:
        existing = cruds.get_user_by_username(db, admin_username)
        if existing is None:
            cruds.create_user_with_password(
                db,
                username=admin_username,
                password=admin_password,
                role="admin",
                display_name="Administrator",
            )


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    ensure_admin_account()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=schemas.AuthResponse)
def register(payload: schemas.UserRegister, db=Depends(get_db)) -> schemas.AuthResponse:
    existing = cruds.get_user_by_username(db, payload.username)
    if existing is not None:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = cruds.create_user_with_password(
        db,
        username=payload.username,
        password=payload.password,
        email=payload.email,
        role="user",
        display_name=payload.display_name or payload.username,
    )
    session = cruds.create_session(db, user.id)
    return schemas.AuthResponse(token=session.token, user=schemas.UserOut.model_validate(user))


@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, db=Depends(get_db)) -> schemas.AuthResponse:
    user = cruds.get_user_by_username(db, payload.username)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not cruds.verify_password(
        payload.password, salt=user.password_salt, password_hash=user.password_hash
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")
    session = cruds.create_session(db, user.id)
    return schemas.AuthResponse(token=session.token, user=schemas.UserOut.model_validate(user))


@app.post("/api/auth/logout")
def logout(authorization: str | None = Header(None), db=Depends(get_db)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        return {"status": "ok"}
    token = authorization.replace("Bearer ", "").strip()
    cruds.revoke_session(db, token)
    return {"status": "ok"}#translator


@app.get("/api/me", response_model=schemas.UserOut)
def get_me(user: User = Depends(get_current_user)) -> schemas.UserOut:
    return schemas.UserOut.model_validate(user)


@app.patch("/api/me/profile", response_model=schemas.UserOut)
def update_profile(
    payload: schemas.ProfileUpdate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> schemas.UserOut:
    data = payload.model_dump(exclude_unset=True)
    updated = cruds.update_user(db, user.id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserOut.model_validate(updated)


@app.get("/api/me/texts", response_model=list[schemas.TextOut])
def my_texts(user: User = Depends(get_current_user), db=Depends(get_db)) -> list[schemas.TextOut]:
    return [schemas.TextOut.model_validate(item) for item in cruds.get_texts_by_user(db, user.id)]


@app.get("/api/me/translations", response_model=list[schemas.TranslationOut])
def my_translations(
    user: User = Depends(get_current_user), db=Depends(get_db)
) -> list[schemas.TranslationOut]:
    return [
        schemas.TranslationOut.model_validate(item)
        for item in cruds.get_translations_by_user(db, user.id)
    ]


@app.get("/api/me/analyses", response_model=list[schemas.TextAnalysisOut])
def my_analyses(
    user: User = Depends(get_current_user), db=Depends(get_db)
) -> list[schemas.TextAnalysisOut]:
    return [schemas.TextAnalysisOut.model_validate(item) for item in cruds.get_analyses_by_user(db, user.id)]


@app.get("/api/todos", response_model=list[schemas.TodoOut])
def list_todos(user: User = Depends(get_current_user), db=Depends(get_db)) -> list[schemas.TodoOut]:
    return [schemas.TodoOut.model_validate(item) for item in cruds.get_todos_by_user(db, user.id)]


@app.post("/api/todos", response_model=schemas.TodoOut)
def create_todo(
    payload: schemas.TodoCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> schemas.TodoOut:
    todo = cruds.create_todo(db, user_id=user.id, title=payload.title)
    return schemas.TodoOut.model_validate(todo)


@app.patch("/api/todos/{todo_id}", response_model=schemas.TodoOut)
def update_todo(
    todo_id: int,
    payload: schemas.TodoUpdate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> schemas.TodoOut:
    todo = db.get(TodoItem, todo_id)
    if todo is None or todo.user_id != user.id:
        raise HTTPException(status_code=404, detail="Todo not found")
    updated = cruds.update_todo(db, todo_id, payload.model_dump(exclude_unset=True))
    if updated is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return schemas.TodoOut.model_validate(updated)


@app.delete("/api/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    todo = db.get(TodoItem, todo_id)
    if todo is None or todo.user_id != user.id:
        raise HTTPException(status_code=404, detail="Todo not found")
    cruds.delete_todo(db, todo_id)
    return {"status": "ok"}


@app.get("/api/chat", response_model=list[schemas.ChatMessageOut])
def get_chat(db=Depends(get_db)) -> list[schemas.ChatMessageOut]:
    messages = cruds.get_recent_chat_messages(db, limit=200)
    output: list[schemas.ChatMessageOut] = []
    for item in reversed(messages):
        user = cruds.get_user(db, item.user_id)
        output.append(
            schemas.ChatMessageOut(
                id=item.id,
                user_id=item.user_id,
                username=user.username if user else "unknown",
                message=item.message,
                created_at=item.created_at,
            )
        )
    return output


@app.post("/api/chat", response_model=schemas.ChatMessageOut)
def post_chat(
    payload: schemas.ChatMessageCreate,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> schemas.ChatMessageOut:
    msg = cruds.create_chat_message(db, user_id=user.id, message=payload.message)
    return schemas.ChatMessageOut(
        id=msg.id,
        user_id=msg.user_id,
        username=user.username,
        message=msg.message,
        created_at=msg.created_at,
    )


@app.get("/api/admin/users", response_model=list[schemas.UserOut])
def admin_users(admin: User = Depends(require_admin), db=Depends(get_db)) -> list[schemas.UserOut]:
    return [schemas.UserOut.model_validate(item) for item in cruds.get_all_users(db, limit=500)]


@app.post("/api/admin/users/{user_id}/ban")
def admin_ban_user(user_id: int, admin: User = Depends(require_admin), db=Depends(get_db)) -> dict:
    updated = cruds.update_user(db, user_id, {"is_active": False})
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


@app.post("/api/admin/users/{user_id}/unban")
def admin_unban_user(user_id: int, admin: User = Depends(require_admin), db=Depends(get_db)) -> dict:
    updated = cruds.update_user(db, user_id, {"is_active": True})
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


@app.patch("/api/admin/users/{user_id}/role")
def admin_set_role(
    user_id: int,
    payload: schemas.UserUpdate,
    admin: User = Depends(require_admin),
    db=Depends(get_db),
) -> schemas.UserOut:
    if payload.role is None:
        raise HTTPException(status_code=400, detail="Role required")
    updated = cruds.update_user(db, user_id, {"role": payload.role})
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserOut.model_validate(updated)


@app.patch("/api/admin/users/{user_id}/level")
def admin_set_level(
    user_id: int,
    payload: schemas.UserUpdate,
    admin: User = Depends(require_admin),
    db=Depends(get_db),
) -> schemas.UserOut:
    if payload.level is None:
        raise HTTPException(status_code=400, detail="Level required")
    updated = cruds.set_user_level(db, user_id, payload.level)
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserOut.model_validate(updated)


@app.patch("/api/admin/users/{user_id}/xp")
def admin_set_xp(
    user_id: int,
    payload: schemas.UserUpdate,
    admin: User = Depends(require_admin),
    db=Depends(get_db),
) -> schemas.UserOut:
    if payload.xp is None:
        raise HTTPException(status_code=400, detail="XP required")
    updated = cruds.add_xp(db, user_id, payload.xp)
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserOut.model_validate(updated)


@app.delete("/api/admin/chat/{message_id}")
def admin_delete_chat(message_id: int, admin: User = Depends(require_admin), db=Depends(get_db)) -> dict:
    deleted = cruds.delete_chat_message(db, message_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"status": "ok"}


@app.post("/api/translate", response_model=TranslateResponse)
def translate(
    payload: TranslateRequest,
    authorization: str | None = Header(None),
    db=Depends(get_db),
) -> TranslateResponse:
    try:
        translator = get_translator(payload.target_language)
        translated = translator.translate(payload.text)
    except Exception as exc:
        logger.exception("Translation failed")
        raise HTTPException(status_code=500, detail=f"Translation failed: {exc!r}") from exc

    user = _get_user_from_token(_get_token_from_header(authorization), db)
    if user is not None:
        text = cruds.create_text(
            db,
            user_id=user.id,
            content=payload.text,
            title=None,
            source_language=None,
        )
        cruds.create_translation(
            db,
            user_id=user.id,
            text_id=text.id,
            target_language=payload.target_language,
            translated_text=translated,
            model=translator.model,
        )

    return TranslateResponse(
        translated_text=translated,
        target_language=payload.target_language,
        model=translator.model,
    )


@app.post("/api/random-words", response_model=RandomWordsResponse)
def random_words(payload: RandomWordsRequest) -> RandomWordsResponse:
    try:
        word_count, words = get_random_words(payload.text, payload.count)
    except Exception as exc:
        logger.exception("Random words failed")
        raise HTTPException(status_code=500, detail=f"Random words failed: {exc!r}") from exc

    return RandomWordsResponse(word_count=word_count, random_words=words)


@app.post("/api/assistant", response_model=AssistantResponse)
def assistant(payload: AssistantRequest) -> AssistantResponse:
    try:
        helper = get_ai_helper()
        answer = helper.chat(payload.message)
    except Exception as exc:
        logger.exception("AI helper failed")
        raise HTTPException(status_code=500, detail=f"AI helper failed: {exc!r}") from exc

    return AssistantResponse(answer=answer, model=helper.model)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)



