from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class UserBase(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: str | None = None
    role: str = "user"
    level: int = 1
    xp: int = 0
    interests: list[str] = Field(default_factory=list)
    display_name: str | None = None
    bio: str | None = None
    is_active: bool = True


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    role: str | None = None
    level: int | None = None
    xp: int | None = None
    interests: list[str] | None = None
    display_name: str | None = None
    bio: str | None = None
    is_active: bool | None = None


class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TextCreate(BaseModel):
    user_id: int
    title: str | None = None
    content: str
    source_language: str | None = None


class TextOut(BaseModel):
    id: int
    user_id: int
    title: str | None = None
    content: str
    source_language: str | None = None
    length: int
    created_at: datetime

    class Config:
        from_attributes = True


class TranslationCreate(BaseModel):
    user_id: int
    text_id: int
    target_language: str
    translated_text: str
    model: str | None = None


class TranslationOut(TranslationCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SentimentOut(BaseModel):
    label: str | None = None
    score: float | None = None


class TextAnalysisCreate(BaseModel):
    user_id: int
    text_id: int
    language: str | None = None
    summary: str | None = None
    sentiment_label: str | None = None
    sentiment_score: float | None = None
    keywords: list[str] = Field(default_factory=list)
    entities: list[str] = Field(default_factory=list)
    toxicity: dict[str, Any] = Field(default_factory=dict)


class TextAnalysisOut(TextAnalysisCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReadingMetricsCreate(BaseModel):
    analysis_id: int
    reading_level: float = 0.0
    word_count: int = 0
    sentence_count: int = 0
    avg_sentence_length: float = 0.0
    difficulty_score: float = 0.0


class ReadingMetricsOut(ReadingMetricsCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogCreate(BaseModel):
    user_id: int
    action: str
    details: dict[str, Any] = Field(default_factory=dict)
    points_delta: int = 0


class ActivityLogOut(ActivityLogCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserRegister(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=6, max_length=128)
    email: str | None = None
    display_name: str | None = None


class UserLogin(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TodoUpdate(BaseModel):
    title: str | None = None
    is_done: bool | None = None


class TodoOut(BaseModel):
    id: int
    user_id: int
    title: str
    is_done: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatMessageOut(BaseModel):
    id: int
    user_id: int
    username: str
    message: str
    created_at: datetime


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    interests: list[str] | None = None


class QuestionCreate(BaseModel):
    question_text: str
    order: int = 0


class QuestionOut(QuestionCreate):
    id: int
    quiz_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    text: str = Field(min_length=1)


class QuizOut(BaseModel):
    id: int
    user_id: int
    title: str
    is_completed: bool
    total_score: int
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionOut] = []

    class Config:
        from_attributes = True


class AnswerCreate(BaseModel):
    question_id: int
    answer_text: str = Field(min_length=1)


class AnswerOut(BaseModel):
    id: int
    question_id: int
    user_id: int
    answer_text: str
    score: int
    feedback: str
    created_at: datetime

    class Config:
        from_attributes = True


class AnswerEvaluation(BaseModel):
    question_id: int
    question_text: str
    answer_text: str


class AnswerEvaluationResponse(BaseModel):
    question_id: int
    score: int
    feedback: str
    xp_gained: int
    user_level: int
    user_xp: int