from M_app.M_Src_Backend.services.game_service.games_coqs_ai import AiQuestioneer






import logging
import os
from datetime import datetime
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


DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000"]
DEFAULT_FREE_MODELS = [
    "openai/gpt-oss-120b:free",
    "tngtech/deepseek-r1t2-chimera:free",
]


def require_env(name: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def parse_models_env(env_name: str) -> list[str]:
    raw = (os.getenv(env_name) or "").strip()
    if not raw:
        return DEFAULT_FREE_MODELS.copy()
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = []
        if isinstance(parsed, list):
            models = [str(item).strip() for item in parsed if str(item).strip()]
            return models or DEFAULT_FREE_MODELS.copy()
    models = [item.strip() for item in raw.split(",") if item.strip()]
    return models or DEFAULT_FREE_MODELS.copy()


def parse_allowed_origins() -> list[str]:
    raw = (os.getenv("ALLOWED_ORIGINS") or "").strip()
    frontend_url = (os.getenv("FRONTEND_URL") or "").strip()
    origins: list[str] = []

    if raw:
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = []
            if isinstance(parsed, list):
                origins = [str(item).strip() for item in parsed if str(item).strip()]
        else:
            origins = [item.strip() for item in raw.split(",") if item.strip()]

    if frontend_url:
        origins.append(frontend_url)

    if not origins:
        origins = DEFAULT_ALLOWED_ORIGINS.copy()

    # Normalize and deduplicate origins to avoid mismatches caused by trailing slash.
    normalized: list[str] = []
    seen: set[str] = set()
    for origin in origins:
        value = origin.rstrip("/")
        if not value or value in seen:
            continue
        seen.add(value)
        normalized.append(value)
    return normalized or DEFAULT_ALLOWED_ORIGINS.copy()


allowed_origins = parse_allowed_origins()
logger.info("CORS allowed origins: %s", allowed_origins)

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
    text: str = Field(min_length=1, max_length=100000)
    count: int = Field(ge=1, le=500)


class RandomWordsResponse(BaseModel):
    word_count: int
    random_words: list[str]


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)


class AssistantResponse(BaseModel):
    answer: str
    model: str


class QuestionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=100000)


class QuestionResponse(BaseModel):
    questions: list[str]


class AnswerRequest(BaseModel):
    question_id: int
    answer_text: str = Field(min_length=1)


class AnswerResponse(BaseModel):
    question_id: int
    score: int
    feedback: str
    xp_gained: int
    user_level: int
    user_xp: int


class QuizStartRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    text: str = Field(min_length=1)


class QuizResponse(BaseModel):
    id: int
    title: str
    is_completed: bool
    total_score: int
    created_at: str
    questions: list[dict] = []


FREE_MODELS_TRANSLATION = parse_models_env("TRANSLATION_MODELS")
FREE_MODELS_QUESTIONEER = parse_models_env("QUESTIONEER_MODELS")
FREE_MODELS_AI_HELPER = parse_models_env("AI_HELPER_MODELS")

def is_rate_limit_error(exc: Exception) -> bool:
    exc_str = str(exc).lower()
    rate_limit_indicators = [
        "429",
        "rate limit",
        "quota",
        "too many requests",
        "limited",
        "exceeded",
    ]
    return any(indicator in exc_str for indicator in rate_limit_indicators)

def try_models(api_key: str, models: list[str], build_fn: callable):
    last_exc = None
    for model in models:
        try:
            instance = build_fn(api_key, model)
            return instance
        except Exception as exc:
            last_exc = exc
            continue
    raise RuntimeError(f"All free models failed: {last_exc!r}") from last_exc


def build_translator_model(api_key: str, model: str) -> MegaladoNNTranslator:
    base_url = require_env("OPENROUTER_BASE_URL")
    return MegaladoNNTranslator(api_key=api_key, target_language="en", model=model, base_url=base_url)

def build_questioneer_model(
    api_key: str,
    model: str,
    text: str,
    title: str | None = None,
) -> AiQuestioneer:
    base_url = require_env("OPENROUTER_BASE_URL")
    return AiQuestioneer(
        api_key=api_key,
        text_to_give_question_about_it=text,
        quiz_title=title,
        model=model,
        base_url=base_url,
    )

def build_ai_helper_model(api_key: str, model: str) -> MegaladoNNAIHelper:
    base_url = require_env("OPENROUTER_BASE_URL")
    return MegaladoNNAIHelper(api_key=api_key, model=model, base_url=base_url)


def build_translator(target_language: str) -> MegaladoNNTranslator:
    api_key = require_env("OPENROUTER_API_KEY")
    return try_models(api_key, FREE_MODELS_TRANSLATION, build_translator_model)

def build_questioneer(text: str, title: str | None = None) -> AiQuestioneer:
    api_key = require_env("OPENROUTER_API_KEY")
    return try_models(
        api_key,
        FREE_MODELS_QUESTIONEER,
        lambda key, model: build_questioneer_model(key, model, text, title),
    )

def build_ai_helper() -> MegaladoNNAIHelper:
    api_key = require_env("OPENROUTER_API_KEY")
    return try_models(api_key, FREE_MODELS_AI_HELPER, build_ai_helper_model)





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
    return {"status": "ok"}


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
    api_key = require_env("OPENROUTER_API_KEY")
    base_url = require_env("OPENROUTER_BASE_URL")
    last_exc = None
    
    for model in FREE_MODELS_TRANSLATION:
        try:
            translator = MegaladoNNTranslator(api_key=api_key, target_language=payload.target_language, model=model, base_url=base_url)
            translated = translator.translate(payload.text)
            
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
        except Exception as exc:
            last_exc = exc
            if not is_rate_limit_error(exc):
                logger.exception(f"Translation failed with model {model}")
                raise
            logger.warning(f"Model {model} rate limited, trying next model")
            continue
    
    logger.exception("Translation failed with all models")
    raise HTTPException(status_code=500, detail=f"Translation failed: {last_exc!r}") from last_exc


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
    api_key = require_env("OPENROUTER_API_KEY")
    base_url = require_env("OPENROUTER_BASE_URL")
    last_exc = None
    
    for model in FREE_MODELS_AI_HELPER:
        try:
            helper = MegaladoNNAIHelper(api_key=api_key, model=model, base_url=base_url)
            answer = helper.chat(payload.message)
            
            return AssistantResponse(answer=answer, model=helper.model)
        except Exception as exc:
            last_exc = exc
            if not is_rate_limit_error(exc):
                logger.exception(f"AI helper failed with model {model}")
                raise
            logger.warning(f"Model {model} rate limited, trying next model")
            continue
    
    logger.exception("AI helper failed with all models")
    raise HTTPException(status_code=500, detail=f"AI helper failed: {last_exc!r}") from last_exc

@app.post("/api/questions", response_model=QuestionResponse)
def generate_questions(payload: QuestionRequest) -> QuestionResponse:
    api_key = require_env("OPENROUTER_API_KEY")
    base_url = require_env("OPENROUTER_BASE_URL")
    last_exc = None
    
    for model in FREE_MODELS_QUESTIONEER:
        try:
            questioneer = AiQuestioneer(
                api_key=api_key,
                text_to_give_question_about_it=payload.text,
                model=model,
                base_url=base_url,
            )
            questions = questioneer.generate_questions()
            return QuestionResponse(questions=questions)
        except Exception as exc:
            last_exc = exc
            if not is_rate_limit_error(exc):
                logger.exception(f"Question generation failed with model {model}")
                raise
            logger.warning(f"Model {model} rate limited, trying next model")
            continue
    
    logger.exception("Question generation failed with all models")
    raise HTTPException(status_code=500, detail=f"Question generation failed: {last_exc!r}") from last_exc


@app.post("/api/quiz/start", response_model=QuizResponse)
def start_quiz(
    payload: QuizStartRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> QuizResponse:
    api_key = require_env("OPENROUTER_API_KEY")
    base_url = require_env("OPENROUTER_BASE_URL")
    last_exc = None
    
    for model in FREE_MODELS_QUESTIONEER:
        try:
            questioneer = AiQuestioneer(
                api_key=api_key,
                text_to_give_question_about_it=payload.text,
                quiz_title=payload.title,
                model=model,
                base_url=base_url,
            )
            questions = questioneer.generate_questions()
            
            quiz = cruds.create_quiz(
                db,
                user_id=user.id,
                title=payload.title,
                text=payload.text,
            )
            
            cruds.create_questions_batch(db, quiz_id=quiz.id, questions=questions)
            
            db.refresh(quiz)
            
            return QuizResponse(
                id=quiz.id,
                title=quiz.title,
                is_completed=quiz.is_completed,
                total_score=quiz.total_score,
                created_at=quiz.created_at.isoformat(),
                questions=[
                    {"id": q.id, "text": q.question_text, "order": q.order}
                    for q in quiz.questions
                ],
            )
        except Exception as exc:
            last_exc = exc
            if not is_rate_limit_error(exc):
                logger.exception(f"Quiz start failed with model {model}")
                raise
            logger.warning(f"Model {model} rate limited, trying next model")
            continue
    
    logger.exception("Quiz start failed with all models")
    raise HTTPException(status_code=500, detail=f"Quiz start failed: {last_exc!r}") from last_exc


@app.get("/api/quiz/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> QuizResponse:
    """Get quiz details"""
    quiz = cruds.get_quiz(db, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        is_completed=quiz.is_completed,
        total_score=quiz.total_score,
        created_at=quiz.created_at.isoformat(),
        questions=[
            {"id": q.id, "text": q.question_text, "order": q.order}
            for q in quiz.questions
        ],
    )


@app.get("/api/quiz")
def get_user_quizzes(
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> list[QuizResponse]:
    """Get all quizzes for current user"""
    quizzes = cruds.get_user_quizzes(db, user.id)
    return [
        QuizResponse(
            id=q.id,
            title=q.title,
            is_completed=q.is_completed,
            total_score=q.total_score,
            created_at=q.created_at.isoformat(),
            questions=[
                {"id": qu.id, "text": qu.question_text, "order": qu.order}
                for qu in q.questions
            ],
        )
        for q in quizzes
    ]


@app.post("/api/answer", response_model=AnswerResponse)
def evaluate_answer(
    payload: AnswerRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> AnswerResponse:
    api_key = require_env("OPENROUTER_API_KEY")
    base_url = require_env("OPENROUTER_BASE_URL")
    last_exc = None
    
    try:
        question = cruds.get_question(db, payload.question_id)
        if question is None:
            raise HTTPException(status_code=404, detail="Question not found")
        
        for model in FREE_MODELS_QUESTIONEER:
            try:
                questioneer = AiQuestioneer(api_key=api_key, text_to_give_question_about_it=question.quiz.text, model=model, base_url=base_url)
                result = questioneer.evaluate_answer(question.question_text, payload.answer_text)
                
                answer = cruds.create_answer(
                    db,
                    question_id=question.id,
                    user_id=user.id,
                    answer_text=payload.answer_text,
                    score=result["score"],
                    feedback=result["feedback"],
                )
                
                xp_gained = result["score"]
                updated_user = cruds.update_user_xp_and_level(db, user.id, xp_gained)
                
                return AnswerResponse(
                    question_id=payload.question_id,
                    score=result["score"],
                    feedback=result["feedback"],
                    xp_gained=xp_gained,
                    user_level=updated_user.level,
                    user_xp=updated_user.xp,
                )
            except Exception as exc:
                last_exc = exc
                if not is_rate_limit_error(exc):
                    logger.exception(f"Answer evaluation failed with model {model}")
                    raise
                logger.warning(f"Model {model} rate limited, trying next model")
                continue
        
        logger.exception("Answer evaluation failed with all models")
        raise HTTPException(status_code=500, detail=f"Answer evaluation failed: {last_exc!r}") from last_exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Answer evaluation failed")
        raise HTTPException(status_code=500, detail=f"Answer evaluation failed: {exc!r}") from exc

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)



