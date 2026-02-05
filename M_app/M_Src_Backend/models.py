from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("username", name="uq_users_username"),
        UniqueConstraint("email", name="uq_users_email"),
        CheckConstraint("level >= 1", name="ck_users_level_min"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    interests: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    texts: Mapped[list["Text"]] = relationship(
        "Text", back_populates="user", cascade="all, delete-orphan"
    )
    translations: Mapped[list["Translation"]] = relationship(
        "Translation", back_populates="user", cascade="all, delete-orphan"
    )
    analyses: Mapped[list["TextAnalysis"]] = relationship(
        "TextAnalysis", back_populates="user", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list["ActivityLog"]] = relationship(
        "ActivityLog", back_populates="user", cascade="all, delete-orphan"
    )


class Text(Base):
    __tablename__ = "texts"
    __table_args__ = (CheckConstraint("length >= 0", name="ck_texts_length"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_language: Mapped[str | None] = mapped_column(String(40), nullable=True)
    length: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="texts")
    translations: Mapped[list["Translation"]] = relationship(
        "Translation", back_populates="text", cascade="all, delete-orphan"
    )
    analyses: Mapped[list["TextAnalysis"]] = relationship(
        "TextAnalysis", back_populates="text", cascade="all, delete-orphan"
    )


class Translation(Base):
    __tablename__ = "translations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    text_id: Mapped[int] = mapped_column(ForeignKey("texts.id"), nullable=False)
    target_language: Mapped[str] = mapped_column(String(40), nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="translations")
    text: Mapped["Text"] = relationship("Text", back_populates="translations")


class TextAnalysis(Base):
    __tablename__ = "text_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    text_id: Mapped[int] = mapped_column(ForeignKey("texts.id"), nullable=False)
    language: Mapped[str | None] = mapped_column(String(40), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    sentiment_label: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sentiment_score: Mapped[float | None] = mapped_column(nullable=True)
    keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    entities: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    toxicity: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="analyses")
    text: Mapped["Text"] = relationship("Text", back_populates="analyses")
    reading_metrics: Mapped["ReadingMetrics"] = relationship(
        "ReadingMetrics", back_populates="analysis", cascade="all, delete-orphan", uselist=False
    )


class ReadingMetrics(Base):
    __tablename__ = "reading_metrics"
    __table_args__ = (
        UniqueConstraint("analysis_id", name="uq_reading_metrics_analysis"),
        CheckConstraint("reading_level >= 0", name="ck_reading_level_min"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("text_analyses.id"), nullable=False)
    reading_level: Mapped[float] = mapped_column(nullable=False, default=0.0)
    word_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sentence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_sentence_length: Mapped[float] = mapped_column(nullable=False, default=0.0)
    difficulty_score: Mapped[float] = mapped_column(nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    analysis: Mapped["TextAnalysis"] = relationship("TextAnalysis", back_populates="reading_metrics")


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    __table_args__ = (CheckConstraint("points_delta >= -100000", name="ck_activity_points"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    points_delta: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="activity_logs")
