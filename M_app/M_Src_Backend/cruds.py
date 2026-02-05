from __future__ import annotations

from typing import Any, Iterable

from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import Session

from .models import (
    ActivityLog,
    ReadingMetrics,
    Text,
    TextAnalysis,
    Translation,
    User,
)


# Users
def create_user(
    db: Session,
    *,
    username: str,
    email: str | None = None,
    role: str = "student",
    level: int = 1,
    xp: int = 0,
    interests: list[str] | None = None,
    is_active: bool = True,
) -> User:
    user = User(
        username=username,
        email=email,
        role=role,
        level=level,
        xp=xp,
        interests=interests or [],
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_username(db: Session, username: str) -> User | None:
    stmt = select(User).where(User.username == username)
    return db.execute(stmt).scalar_one_or_none()


def get_all_users(db: Session, *, limit: int = 100, offset: int = 0) -> list[User]:
    stmt = select(User).order_by(User.id).limit(limit).offset(offset)
    return list(db.execute(stmt).scalars().all())


def update_user(db: Session, user_id: int, data: dict[str, Any]) -> User | None:
    if not data:
        return get_user(db, user_id)
    stmt = update(User).where(User.id == user_id).values(**data).returning(User)
    result = db.execute(stmt).scalar_one_or_none()
    if result is None:
        return None
    db.commit()
    return result


def delete_user(db: Session, user_id: int) -> bool:
    stmt = delete(User).where(User.id == user_id)
    result = db.execute(stmt)
    db.commit()
    return result.rowcount > 0


# Texts
def create_text(
    db: Session,
    *,
    user_id: int,
    content: str,
    title: str | None = None,
    source_language: str | None = None,
) -> Text:
    text = Text(
        user_id=user_id,
        title=title,
        content=content,
        source_language=source_language,
        length=len(content or ""),
    )
    db.add(text)
    db.commit()
    db.refresh(text)
    return text


def get_text(db: Session, text_id: int) -> Text | None:
    return db.get(Text, text_id)


def get_texts_by_user(db: Session, user_id: int, *, limit: int = 100, offset: int = 0) -> list[Text]:
    stmt = (
        select(Text)
        .where(Text.user_id == user_id)
        .order_by(Text.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.execute(stmt).scalars().all())


# Translations
def create_translation(
    db: Session,
    *,
    user_id: int,
    text_id: int,
    target_language: str,
    translated_text: str,
    model: str | None = None,
) -> Translation:
    translation = Translation(
        user_id=user_id,
        text_id=text_id,
        target_language=target_language,
        translated_text=translated_text,
        model=model,
    )
    db.add(translation)
    db.commit()
    db.refresh(translation)
    return translation


def get_translations_by_user(
    db: Session, user_id: int, *, limit: int = 100, offset: int = 0
) -> list[Translation]:
    stmt = (
        select(Translation)
        .where(Translation.user_id == user_id)
        .order_by(Translation.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.execute(stmt).scalars().all())


# Analysis
def create_text_analysis(
    db: Session,
    *,
    user_id: int,
    text_id: int,
    language: str | None = None,
    summary: str | None = None,
    sentiment_label: str | None = None,
    sentiment_score: float | None = None,
    keywords: list[str] | None = None,
    entities: list[str] | None = None,
    toxicity: dict[str, Any] | None = None,
) -> TextAnalysis:
    analysis = TextAnalysis(
        user_id=user_id,
        text_id=text_id,
        language=language,
        summary=summary,
        sentiment_label=sentiment_label,
        sentiment_score=sentiment_score,
        keywords=keywords or [],
        entities=entities or [],
        toxicity=toxicity or {},
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def create_reading_metrics(
    db: Session,
    *,
    analysis_id: int,
    reading_level: float = 0.0,
    word_count: int = 0,
    sentence_count: int = 0,
    avg_sentence_length: float = 0.0,
    difficulty_score: float = 0.0,
) -> ReadingMetrics:
    metrics = ReadingMetrics(
        analysis_id=analysis_id,
        reading_level=reading_level,
        word_count=word_count,
        sentence_count=sentence_count,
        avg_sentence_length=avg_sentence_length,
        difficulty_score=difficulty_score,
    )
    db.add(metrics)
    db.commit()
    db.refresh(metrics)
    return metrics


def get_analyses_by_user(
    db: Session, user_id: int, *, limit: int = 100, offset: int = 0
) -> list[TextAnalysis]:
    stmt = (
        select(TextAnalysis)
        .where(TextAnalysis.user_id == user_id)
        .order_by(TextAnalysis.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.execute(stmt).scalars().all())


# Activity / dev controls
def log_activity(
    db: Session,
    *,
    user_id: int,
    action: str,
    details: dict[str, Any] | None = None,
    points_delta: int = 0,
) -> ActivityLog:
    log = ActivityLog(
        user_id=user_id,
        action=action,
        details=details or {},
        points_delta=points_delta,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def boost_user_level(db: Session, user_id: int, levels: int = 1) -> User | None:
    if levels == 0:
        return get_user(db, user_id)
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(level=User.level + levels)
        .returning(User)
    )
    user = db.execute(stmt).scalar_one_or_none()
    if user is None:
        return None
    db.commit()
    log_activity(
        db,
        user_id=user_id,
        action="dev_level_boost",
        details={"levels": levels},
        points_delta=0,
    )
    return user


def set_user_level(db: Session, user_id: int, level: int) -> User | None:
    stmt = update(User).where(User.id == user_id).values(level=level).returning(User)
    user = db.execute(stmt).scalar_one_or_none()
    if user is None:
        return None
    db.commit()
    log_activity(
        db,
        user_id=user_id,
        action="dev_set_level",
        details={"level": level},
        points_delta=0,
    )
    return user


def add_xp(db: Session, user_id: int, xp: int) -> User | None:
    stmt = update(User).where(User.id == user_id).values(xp=User.xp + xp).returning(User)
    user = db.execute(stmt).scalar_one_or_none()
    if user is None:
        return None
    db.commit()
    log_activity(
        db,
        user_id=user_id,
        action="xp_change",
        details={"xp_delta": xp},
        points_delta=xp,
    )
    return user


def add_user_interests(db: Session, user_id: int, interests: Iterable[str]) -> User | None:
    user = get_user(db, user_id)
    if user is None:
        return None
    current = set(user.interests or [])
    for item in interests:
        item = (item or "").strip()
        if item:
            current.add(item)
    user.interests = sorted(current)
    db.add(user)
    db.commit()
    db.refresh(user)
    log_activity(
        db,
        user_id=user_id,
        action="update_interests",
        details={"count": len(user.interests)},
        points_delta=0,
    )
    return user


def watch_user(
    db: Session, user_id: int, reason: str = "dev_watch", tags: dict[str, Any] | None = None
) -> ActivityLog:
    return log_activity(
        db,
        user_id=user_id,
        action="watch_user",
        details={"reason": reason, "tags": tags or {}},
        points_delta=0,
    )


def count_users(db: Session) -> int:
    stmt = select(func.count(User.id))
    return int(db.execute(stmt).scalar_one() or 0)
