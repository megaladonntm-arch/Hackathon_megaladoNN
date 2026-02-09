# Reader-Overlay Kids - Hackathon Project

Платформа для облегченного чтения на иностранных языках с интерактивным переводом и анализом текста.

## Структура проекта

```
Hackathon_megaladoNN/
├── main.py                 # FastAPI backend
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (ЗАПОЛНИ!)
├── .env.example           # Template for .env
├── invest-uz/             # React frontend
│   ├── .env               # React env variables
│   ├── .env.example       # React env template
│   └── src/
│       ├── components/    # React components
│       ├── App.js         # Main app
│       └── ThemeContext.js # Theme management
└── M_app/                 # Backend services
    └── M_Src_Backend/
        ├── services/      # AI, translation, text analysis
        ├── models.py      # Database models
        ├── schemas.py     # Pydantic schemas
        └── cruds.py       # Database operations
```

## Быстрый старт

### 1. Настройка Backend (Python)

```bash
# Установить зависимости
pip install -r requirements.txt

# Создать .env файл (ОБЯЗАТЕЛЬНО!)
cp .env.example .env

# Отредактировать .env - вставить API ключ:
# OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx

# Запустить сервер
python -m uvicorn main:app --reload
```

Backend будет доступен на `http://localhost:8000`

### 2. Настройка Frontend (React)

```bash
cd invest-uz

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env
# (Обычно REACT_APP_API_BASE=http://localhost:8000 уже там)

# Запустить dev сервер
npm start
```

Frontend будет доступен на `http://localhost:3000`

## Переменные окружения

### Backend (.env)

```env
# OpenRouter API (ОБЯЗАТЕЛЬНО заполни!)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# AI Models
TRANSLATION_MODEL=tngtech/deepseek-r1t2-chimera:free
AI_HELPER_MODEL=tngtech/deepseek-r1t2-chimera:free

# Database
DATABASE_URL=sqlite:///./readers.db

# Admin account
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# CORS (для фронтенда)
ALLOWED_ORIGINS=["http://localhost:3000"]

# Debug mode
DEBUG=True
```

### Frontend (.env)

```env
REACT_APP_API_BASE=http://localhost:8000
```

## Основные фичи

✅ **Перевод текстов** - Overlay, Magnifier и Split режимы
✅ **Много языков** - EN, RU, UZ, TR, DE, FR, ES и др.
✅ **Анализ текста** - Выделение случайных слов для обучения
✅ **AI Помощник** - ChatBot на базе DeepSeek
✅ **Аутентификация** - JWT-based система
✅ **Профиль пользователя** - История, статистика
✅ **4 Темы оформления** - Light, Dark, Blue, Sunset
⚙️ **Система рангов** - MVP (только на фронтенде пока)

## API Endpoints

### Auth (без токена)
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/health` - Проверка сервера

### User (требует токена в header: `Authorization: Bearer {token}`)
- `GET /api/me` - Get current user
- `PUT /api/me` - Update profile
- `GET /api/me/texts` - User texts
- `GET /api/me/translations` - User translations

### Tools (требует токена)
- `POST /api/translate` - Перевод текста
- `POST /api/random-words` - Случайные слова
- `POST /api/assistant` - AI chat

Полная документация: `http://localhost:8000/docs`

## Технологический стек

**Frontend:**
- React 19
- React Router 7
- CSS3 с переменными и gradients
- Context API для управления состоянием

**Backend:**
- FastAPI
- SQLAlchemy + SQLite
- OpenRouter API (DeepSeek AI)
- JWT для аутентификации

## Важно перед демо

1. **ЗАПОЛНИТЬ .env** - Без API ключа не будет работать перевод и AI
2. **Проверить CORS** - Фронт и бэк на разных портах
3. **Установить зависимости** - `pip install -r requirements.txt`
4. **Запустить оба сервера**:
   - Backend: `python -m uvicorn main:app --reload`
   - Frontend: `npm start` (из папки invest-uz/)

## Контакты

GitHub: https://github.com/megaladonntm-arch

---

**Status:** MVP версия для хакатона 🚀
