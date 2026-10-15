# TruthLens – Fake News Detection

> AI-powered fake news detection using **NewsAPI**, **NLP preprocessing**, and **Machine Learning**.  
> Built as a final-year / portfolio project with a production-style architecture.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Prerequisites](#6-prerequisites)
7. [Environment Variables](#7-environment-variables)
8. [MySQL Setup](#8-mysql-setup)
9. [NewsAPI Setup](#9-newsapi-setup)
10. [ML Dataset Setup](#10-ml-dataset-setup)
11. [Backend Installation & Startup](#11-backend-installation--startup)
12. [ML Model Training](#12-ml-model-training)
13. [Frontend Installation & Startup](#13-frontend-installation--startup)
14. [API Documentation](#14-api-documentation)
15. [Running Tests](#15-running-tests)
16. [How It Works](#16-how-it-works)
17. [Screenshots](#17-screenshots)
18. [Future Enhancements](#18-future-enhancements)
19. [Disclaimer](#19-disclaimer)

---

## 1. Project Overview

**TruthLens** is a full-stack web application that helps users evaluate whether a news article exhibits patterns consistent with real or fake news. It combines:

- **Live news fetching** via the NewsAPI (search, top headlines, categories)
- **NLP preprocessing** (tokenisation, stop-word removal, lemmatisation)
- **TF-IDF feature extraction** with a trained ML classifier (Logistic Regression / SVM)
- **Per-class probability output** with a visual confidence meter
- **Prediction history** stored in MySQL, accessible from a personal dashboard
- **JWT-authenticated user accounts** with register / login

> ⚠ TruthLens produces **model predictions**, not factual verifications.  
> Always cross-check results with established fact-checking sources.

---

## 2. Features

| Feature | Description |
|---|---|
| 🔍 **News Search** | Search live articles or browse top headlines by category/country |
| 🤖 **ML Prediction** | REAL / FAKE label + confidence % for any article or pasted text |
| 📊 **Confidence Meter** | Visual probability bar with per-class breakdown |
| 💡 **Explainability** | Top NLP keywords and processed-text preview |
| 📈 **Dashboard** | 14-day trend chart, pie chart, average confidence |
| 🕓 **History** | Full prediction log with search, filter, pagination, delete |
| 🔖 **Saved Articles** | Bookmark articles for later |
| 🔐 **Authentication** | JWT-based register/login, bcrypt password hashing |
| 🌙 **Dark / Light Theme** | Persisted per-user preference |
| 📱 **Responsive UI** | Mobile-first Tailwind CSS design |
| 📄 **Swagger Docs** | Auto-generated API docs at `/docs` |

---

## 3. Architecture

```
Browser (React + Vite)
        │  REST API (JSON)
        ▼
FastAPI Backend  ──► MySQL (SQLAlchemy ORM)
        │
        ├── NLP Service (NLTK)
        │       └── clean_text → tokenise → stop-words → lemmatise
        │
        ├── Prediction Service (scikit-learn)
        │       └── TF-IDF → LogReg / SVM → probability
        │
        └── NewsAPI Service (httpx)
                └── top-headlines / everything
```

**Request flow for a prediction:**

```
User submits headline + content
        ↓
FastAPI POST /api/predict
        ↓
nlp_service.preprocess_for_prediction()
   • lowercase → strip HTML/URLs → remove punctuation
   • tokenise → drop stop-words → lemmatise
        ↓
TfidfVectorizer.transform()   (fitted on training data only)
        ↓
Model.predict() + predict_proba()
        ↓
JSON: { prediction, confidence, fake_probability, real_probability, keywords }
        ↓
Saved to predictions table (if authenticated)
        ↓
React renders PredictionCard with ConfidenceMeter
```

---

## 4. Technology Stack

### Frontend
| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| HTTP client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | react-hot-toast |

### Backend
| | |
|---|---|
| Framework | FastAPI |
| Server | Uvicorn |
| ORM | SQLAlchemy 2 |
| DB Driver | PyMySQL |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| Validation | Pydantic v2 |
| HTTP client | httpx (async) |

### Machine Learning / NLP
| | |
|---|---|
| NLP | NLTK (tokenise, stop-words, lemmatise) |
| Features | TF-IDF (5 000 features, unigrams + bigrams) |
| Models | Logistic Regression, Multinomial Naive Bayes, Linear SVM |
| Selection | Best F1 score on held-out test set |
| Serialisation | joblib |

### Database
| | |
|---|---|
| Engine | MySQL 8 |
| Tables | `users`, `predictions`, `saved_articles` |

---

## 5. Project Structure

```
Fake News Detection/
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app + lifespan
│   │   ├── config.py             # pydantic-settings
│   │   ├── database/
│   │   │   └── base.py           # engine, SessionLocal, Base, get_db
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── prediction.py
│   │   │   └── saved_article.py
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── prediction.py
│   │   │   ├── news.py
│   │   │   └── dashboard.py
│   │   ├── routes/               # FastAPI routers
│   │   │   ├── auth.py           # POST /api/auth/register|login, GET /me
│   │   │   ├── news.py           # GET /api/news, POST /save, GET /saved
│   │   │   ├── prediction.py     # POST /api/predict, GET /model/info
│   │   │   ├── history.py        # GET|DELETE /api/history
│   │   │   └── dashboard.py      # GET /api/dashboard
│   │   ├── services/
│   │   │   ├── nlp_service.py    # Text cleaning + keyword extraction
│   │   │   ├── prediction_service.py  # Singleton model loader
│   │   │   └── news_api_service.py    # httpx NewsAPI wrapper
│   │   └── utils/
│   │       └── auth.py           # JWT helpers, get_current_user
│   │
│   ├── ml/
│   │   ├── preprocess.py         # Load datasets, clean, save CSV
│   │   ├── train.py              # Train LR/NB/SVM, save best model
│   │   ├── evaluate.py           # Print classification report
│   │   └── models/               # Saved .pkl files (git-ignored)
│   │       ├── fake_news_model.pkl
│   │       ├── tfidf_vectorizer.pkl
│   │       └── metrics.json
│   │
│   ├── data/                     # Raw CSVs (git-ignored)
│   │   ├── Fake.csv
│   │   └── True.csv
│   │
│   ├── tests/
│   │   ├── conftest.py           # SQLite patch + shared fixtures
│   │   ├── test_auth.py
│   │   ├── test_nlp.py
│   │   ├── test_prediction.py
│   │   ├── test_history.py
│   │   ├── test_news_api.py
│   │   └── test_dashboard.py
│   │
│   ├── requirements.txt
│   ├── .env.example
│   ├── start.ps1                 # Windows one-click startup
│   └── start.sh                  # Linux/macOS one-click startup
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── NewsCard.tsx
    │   │   ├── PredictionCard.tsx
    │   │   ├── ConfidenceMeter.tsx
    │   │   └── Loading.tsx
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── NewsSearch.tsx
    │   │   ├── AnalyzeNews.tsx
    │   │   ├── History.tsx
    │   │   ├── Login.tsx
    │   │   └── Register.tsx
    │   ├── context/
    │   │   ├── AuthContext.tsx
    │   │   └── ThemeContext.tsx
    │   ├── hooks/
    │   │   ├── useApi.ts
    │   │   └── useDebounce.ts
    │   ├── services/
    │   │   └── api.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## 6. Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Python | 3.10+ | 3.13 tested |
| Node.js | 18+ | 20 LTS recommended |
| npm | 9+ | Bundled with Node |
| MySQL | 8.0+ | Community edition is fine |
| Git | Any | — |

---

## 7. Environment Variables

Copy the example file and fill in your values:

```bash
cd backend
cp .env.example .env   # Linux/macOS
copy .env.example .env # Windows
```

| Variable | Required | Description |
|---|---|---|
| `NEWS_API_KEY` | ✅ | Your key from newsapi.org |
| `DATABASE_URL` | ✅ | SQLAlchemy URL: `mysql+pymysql://user:pass@host:port/db` |
| `DB_HOST` | ✅ | MySQL host (usually `localhost`) |
| `DB_PORT` | ✅ | MySQL port (default `3306`) |
| `DB_NAME` | ✅ | Database name (e.g. `truthlens`) |
| `DB_USER` | ✅ | MySQL username |
| `DB_PASSWORD` | ✅ | MySQL password |
| `JWT_SECRET` | ✅ | Long random string — change before production |
| `JWT_EXPIRE_MINUTES` | ✗ | Token TTL in minutes (default `1440` = 24 h) |
| `CORS_ORIGINS` | ✗ | Comma-separated allowed origins |
| `MODEL_PATH` | ✗ | Path to saved model pkl |
| `VECTORIZER_PATH` | ✗ | Path to saved vectorizer pkl |

> **Never commit `.env` to version control.** It is already in `.gitignore`.

---

## 8. MySQL Setup

```sql
-- Run in your MySQL client
CREATE DATABASE truthlens CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'truthlens_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON truthlens.* TO 'truthlens_user'@'localhost';
FLUSH PRIVILEGES;
```

Tables are **created automatically** by SQLAlchemy on first startup — no migration scripts needed.

Update `.env`:

```env
DB_USER=truthlens_user
DB_PASSWORD=your_password
DB_NAME=truthlens
DATABASE_URL=mysql+pymysql://truthlens_user:your_password@localhost:3306/truthlens
```

---

## 9. NewsAPI Setup

1. Register for a **free** account at [https://newsapi.org/register](https://newsapi.org/register)
2. Copy your API key from the dashboard
3. Add it to `.env`:

```env
NEWS_API_KEY=your_key_here
```

**Free tier limits:**
- 100 requests / day
- Articles up to 1 month old
- Top headlines + everything endpoints

The app handles missing/invalid keys gracefully — news features return a `503` with a clear message rather than crashing.

---

## 10. ML Dataset Setup

The model works out of the box with a **built-in sample dataset** (16 labelled articles) that auto-trains on first startup. For a production-quality model, use the full Kaggle dataset:

1. Download **"Fake and Real News Dataset"** from Kaggle:  
   [https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset](https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset)

2. Place the two CSV files in `backend/data/`:

```
backend/
└── data/
    ├── Fake.csv   (~23 000 rows)
    └── True.csv   (~21 000 rows)
```

Expected columns: `title`, `text`, `subject`, `date`

3. Re-run training (see [Section 12](#12-ml-model-training)).

---

## 11. Backend Installation & Startup

### Option A — One-click script

**Windows (PowerShell):**
```powershell
cd backend
.\start.ps1
```

**Linux / macOS:**
```bash
cd backend
bash start.sh
```

The script: creates a venv → installs deps → trains the model if needed → starts uvicorn.

### Option B — Manual

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Linux/macOS
# OR
.\venv\Scripts\Activate.ps1       # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server starts at **http://localhost:8000**

---

## 12. ML Model Training

The model auto-trains from the sample dataset on first startup. To explicitly train (or re-train after adding the full dataset):

```bash
cd backend

# Step 1 – Preprocess raw CSVs into a clean dataset
python -m ml.preprocess

# Step 2 – Train all three models, select best by F1, save .pkl files
python -m ml.train

# Step 3 – (Optional) Print a detailed evaluation report
python -m ml.evaluate
```

**Output files:**
```
backend/ml/models/
├── fake_news_model.pkl      # Best classifier
├── tfidf_vectorizer.pkl     # Fitted TF-IDF vectorizer
└── metrics.json             # Accuracy, precision, recall, F1 for all models
```

**Expected performance (full Kaggle dataset):**

| Model | Accuracy | F1 |
|---|---|---|
| Logistic Regression | ~98% | ~0.98 |
| Linear SVM | ~99% | ~0.99 |
| Naive Bayes | ~94% | ~0.94 |

> Results vary with dataset splits. The best model is selected automatically.

---

## 13. Frontend Installation & Startup

```bash
cd frontend

# Install dependencies
npm install

# Start development server (with API proxy to localhost:8000)
npm run dev
```

The app opens at **http://localhost:5173**

The Vite dev server proxies all `/api` requests to `http://localhost:8000`, so no CORS issues during development.

**Production build:**
```bash
npm run build     # outputs to frontend/dist/
npm run preview   # serve the built output locally
```

---

## 14. API Documentation

FastAPI generates interactive documentation automatically:

| URL | Description |
|---|---|
| http://localhost:8000/docs | Swagger UI (try endpoints live) |
| http://localhost:8000/redoc | ReDoc (clean reference view) |
| http://localhost:8000/health | Health check (DB + model status) |

### Key Endpoints

```
POST /api/auth/register        Register a new user
POST /api/auth/login           Login, receive JWT
GET  /api/auth/me              Current user info

GET  /api/news                 Search/fetch news (NewsAPI)
GET  /api/news/headlines       Top headlines
POST /api/news/save            Save article (auth required)
GET  /api/news/saved           List saved articles (auth required)
DELETE /api/news/saved/{id}    Remove saved article

POST /api/predict              Analyze article → REAL/FAKE
GET  /api/model/info           Model metadata and training metrics

GET  /api/history              Prediction history (auth required)
GET  /api/history/count        Real/fake totals
GET  /api/history/{id}         Single prediction detail
DELETE /api/history/{id}       Delete one prediction
DELETE /api/history            Clear all history

GET  /api/dashboard            Aggregated stats + 14-day trend
```

### Example: Predict Request

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Scientists announce major climate breakthrough",
    "content": "Researchers at MIT have developed a new carbon capture technology..."
  }'
```

**Response:**
```json
{
  "prediction": "REAL",
  "confidence": 0.9312,
  "label": 1,
  "fake_probability": 0.0688,
  "real_probability": 0.9312,
  "keywords": [
    {"word": "scientist", "score": 0.0421},
    {"word": "research", "score": 0.0387}
  ],
  "processed_text_preview": "scientist announce major climate breakthrough researcher mit develop new carbon capture technology..."
}
```

---

## 15. Running Tests

```bash
cd backend

# Run all tests
python -m pytest tests/ -v

# Run a specific module
python -m pytest tests/test_auth.py -v
python -m pytest tests/test_nlp.py -v
python -m pytest tests/test_prediction.py -v

# With coverage (install pytest-cov first)
pip install pytest-cov
python -m pytest tests/ --cov=app --cov-report=term-missing
```

**Test coverage:**

| Module | Tests | What's covered |
|---|---|---|
| `test_auth.py` | 12 | Register, login, /me, validation, duplicate email, invalid token |
| `test_nlp.py` | 24 | clean_text, combine, preprocess, keywords, stats |
| `test_prediction.py` | 11 | Predict endpoint, response shape, validation, DB save |
| `test_history.py` | 13 | CRUD, filter, search, pagination, auth guard |
| `test_news_api.py` | 9 | Save/list/delete saved articles, auth guard, input validation |
| `test_dashboard.py` | 9 | Stats shape, counts, percentages, daily stats, health check |
| **Total** | **85** | |

Tests use **SQLite in-memory** — MySQL is never required to run tests.

---

## 16. How It Works

### NLP Pipeline

```
Raw text input
    │
    ▼  1. Lowercase
    ▼  2. Strip HTML tags  (<b>text</b> → text)
    ▼  3. Remove URLs
    ▼  4. Remove @mentions, #hashtags
    ▼  5. Remove non-alpha characters (keep spaces)
    ▼  6. Tokenise (NLTK word_tokenize)
    ▼  7. Remove stop-words + domain-specific noise words
    ▼  8. Remove tokens shorter than 3 characters
    ▼  9. Lemmatise (WordNetLemmatizer)
    │
    ▼
Clean token string  →  TF-IDF  →  ML Classifier
```

**Example:**

| Stage | Text |
|---|---|
| Raw | `BREAKING!!! Scientists have discovered a NEW miracle cure!!!` |
| Cleaned | `breaking scientist discover new miracle cure` |

### ML Training Pipeline

1. Load `Fake.csv` + `True.csv` (or built-in samples)
2. Assign labels: `FAKE=0`, `REAL=1`
3. Combine headline (×3 weight) + content
4. Apply NLP cleaning
5. 80/20 train/test split (stratified)
6. Fit `TfidfVectorizer(max_features=5000, ngram_range=(1,2))`
7. Train Logistic Regression, Naive Bayes, Linear SVM (calibrated)
8. Evaluate all three; save best by F1 score
9. Persist model + vectorizer with `joblib`

---

## 17. Screenshots

> Add screenshots to a `docs/screenshots/` folder and link them here.

| Page | Description |
|---|---|
| `home.png` | Landing page with hero, how-it-works, stats |
| `analyze.png` | Article input form + prediction result card |
| `news-search.png` | NewsAPI card grid with Analyze button |
| `dashboard.png` | Stats cards + area chart + pie chart |
| `history.png` | Expandable history rows with filter + search |
| `login.png` | Login form |
| `register.png` | Register with password strength meter |

---

## 18. Future Enhancements

- [ ] **Larger dataset** — Train on LIAR, FakeNewsNet, or ISOT datasets
- [ ] **Deep learning model** — BERT / RoBERTa fine-tuned classifier
- [ ] **Source credibility scoring** — Cross-reference known reliable/unreliable domains
- [ ] **Browser extension** — Analyze articles directly on news websites
- [ ] **Multilingual support** — Extend NLP pipeline beyond English
- [ ] **Feedback loop** — Users can flag incorrect predictions; retrain periodically
- [ ] **Rate limiting** — Per-user prediction limits to prevent abuse
- [ ] **Email verification** — Confirm email on register
- [ ] **OAuth login** — Google / GitHub sign-in
- [ ] **Docker Compose** — One-command full-stack setup

---

## 19. Disclaimer

TruthLens is an **educational / portfolio project**.

The ML classifier identifies statistical patterns in text that correlate with fake news in the training dataset. It does **not**:

- Access or query external fact-checking databases
- Verify specific claims, names, dates, or statistics
- Provide legal, journalistic, or editorial judgement

**Always verify important news with authoritative sources:**
- [Snopes](https://www.snopes.com)
- [PolitiFact](https://www.politifact.com)
- [FactCheck.org](https://www.factcheck.org)
- [AP Fact Check](https://apnews.com/hub/ap-fact-check)
- [Reuters Fact Check](https://www.reuters.com/fact-check/)

---

*Built with React, FastAPI, Scikit-learn, NLTK, and NewsAPI.*
