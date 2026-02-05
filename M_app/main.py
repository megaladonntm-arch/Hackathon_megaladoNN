import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from M_Src_Backend.services.ai_text_analyzer import MegaladoNNTranslator

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
    text: str = Field(min_length=1, max_length=12000)
    target_language: str = Field(min_length=2, max_length=32)


class TranslateResponse(BaseModel):
    translated_text: str
    target_language: str
    model: str


def build_translator(target_language: str) -> MegaladoNNTranslator:
    api_key = ""
    model = "tngtech/deepseek-r1t2-chimera:free"
    base_url = "https://openrouter.ai/api/v1"
    return MegaladoNNTranslator(
        api_key=api_key,
        target_language=target_language,
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
