# Reader-Overlay Kids - Хакатон Лойиҳаси

Чет тилларида матнни ўқиш учун интерактив таржима ва текст анализ платформаси.

## Лойиҳа структураси

```
Hackathon_megaladoNN/
├── main.py                 # FastAPI backend
├── requirements.txt        # Python зависимости
├── .env                    # Муҳит ўзгарувчилари (ТҚ ТА!)
├── .env.example           # .env намунаси
├── invest-uz/             # React frontend
│   ├── .env               # React муҳит ўзгарувчилари
│   ├── .env.example       # React .env намунаси
│   └── src/
│       ├── components/    # React компонентлари
│       ├── App.js         # Асосий илова
│       └── ThemeContext.js # Тема бошқаруви
└── M_app/                 # Backend сервисları
    └── M_Src_Backend/
        ├── services/      # AI, таржима, текст анализ
        ├── models.py      # БД моделлари
        ├── schemas.py     # Pydantic схемалари
        └── cruds.py       # БД операциялари
```

## Тез Қўлланиш

### 1. Backend Ўрнатиш (Python)

```bash
pip install -r requirements.txt

cp .env.example .env

# .env файлни таҳрир қилинг - API калитини қўйинг:
# OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx

python -m uvicorn main:app --reload
```

Backend `http://localhost:8000` манзилида мавжуд бўлади

### 2. Frontend Ўрнатиш (React)

```bash
cd invest-uz

npm install

cp .env.example .env

npm start
```

Frontend `http://localhost:3000` манзилида мавжуд бўлади

## Муҳит ўзгарувчилари

### Backend (.env)

```env
OWN_API = xxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

TRANSLATION_MODEL=tngtech/deepseek-r1t2-chimera:free
AI_HELPER_MODEL=tngtech/deepseek-r1t2-chimera:free

DATABASE_URL=sqlite:///./readers.db

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

ALLOWED_ORIGINS=["http://localhost:3000"]

DEBUG=True
```

### Frontend (.env)

```env
REACT_APP_API_BASE=http://localhost:8000
```

## Асосий хусусиятлари

✅ **Матнни таржима қилиш** - Overlay, Magnifier ва Split режимлари
✅ **Кўп тиллар** - EN, RU, UZ, TR, DE, FR, ES ва бошқа
✅ **Текст анализ** - Ўқиш учун сўзларни ажратиб олиш
✅ **AI Ёрдамчи** - DeepSeek асосидаги ChatBot
✅ **Аутентификация** - JWT-асосидаги система
✅ **Фойдаланувчи профили** - Тарихи, статистика
✅ **4 та Дизайн темаси** - Light, Dark, Blue, Sunset
⚙️ **Рейтинг системаси** - MVP (шу деми фронтенда эса)

## API Нуқталари

### Auth (токен сарф қилмасдан)
- `POST /api/auth/register` - Рўйхатдан ўтиш
- `POST /api/auth/login` - Кириш
- `GET /api/health` - Сервер tekшируви

### User (header орқали токен керак: `Authorization: Bearer {token}`)
- `GET /api/me` - Жорий фойдаланувчинипи олиш
- `PUT /api/me` - Профилни янгилаш
- `GET /api/me/texts` - Фойдаланувчининг матнлари
- `GET /api/me/translations` - Фойдаланувчининг таржималари

### Tools (токен керак)
- `POST /api/translate` - Матнни таржима қилиш
- `POST /api/random-words` - Сўзларни танлаш
- `POST /api/assistant` - AI чат

Тўлиқ ҳужжатлар: `http://localhost:8000/docs`

## Технологик стек

**Frontend:**
- React 19
- React Router 7
- CSS3 ўзгарувчилари ва gradients
- Context API ҳолати бошқаруви учун

**Backend:**
- FastAPI
- SQLAlchemy + SQLite
- OpenRouter API (DeepSeek AI)
- JWT аутентификация

## Демо ҳамда мҳим

1. **.env ТҚ ТА'** - API калитисиз таржима ва AI ишламайди
2. **CORS текширинг** - Frontend ва backend турли портлардан
3. **Зависимоталарни ўрнатинг** - `pip install -r requirements.txt`
4. **Икки сервернипи ишга туширинг**:
   - Backend: `python -m uvicorn main:app --reload`
   - Frontend: `npm start` (invest-uz папкасидан)

## Контактлар


---

**Ҳолати:** MVP версия хакатон учун 🚀
