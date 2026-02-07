import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from M_app.M_Src_Backend.services.ai_helper.ai_helper_message_chat import MegaladoNNAIHelper
from M_app.M_Src_Backend.services.text_analyzer.ai_text_analyzer import MegaladoNNTranslator
from M_app.M_Src_Backend.services.text_analyzer.text_random_words import get_random_words


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("translator")

app = FastAPI(title="Reader-Overlay API", version="0.1.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


def build_translator(target_language: str) -> MegaladoNNTranslator:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    model = os.getenv("TRANSLATION_MODEL", "tngtech/deepseek-r1t2-chimera:free")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    return MegaladoNNTranslator(
        api_key=api_key,
        target_language=target_language,
        model=model,
        base_url=base_url,
    )


def build_ai_helper() -> MegaladoNNAIHelper:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    model = os.getenv("AI_HELPER_MODEL", "tngtech/deepseek-r1t2-chimera:free")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    return MegaladoNNAIHelper(
        api_key=api_key,
        model=model,
        base_url=base_url,
    )


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/translate", response_model=TranslateResponse)
def translate(payload: TranslateRequest) -> TranslateResponse:
    try:
        translator = build_translator(payload.target_language)
        translated = translator.translate(payload.text)
    except Exception as exc:
        logger.exception("Translation failed")
        raise HTTPException(status_code=500, detail=f"Translation failed: {exc!r}") from exc

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
        helper = build_ai_helper()
        answer = helper.chat(payload.message)
    except Exception as exc:
        logger.exception("AI helper failed")
        raise HTTPException(status_code=500, detail=f"AI helper failed: {exc!r}") from exc

    return AssistantResponse(answer=answer, model=helper.model)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
