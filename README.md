# InfiniteIQ

> AI-powered support intelligence system built as a case study for CloudWalk/InfinitePay.

**Live demo:** [infiniteiq.vercel.app](https://infiniteiq.vercel.app)

![InfiniteIQ preview](assets/preview.gif)

---

## What is this?

InfiniteIQ has two modules:

**1. Review Analyzer**
Scrapes real Google Play reviews from InfinitePay, classifies them by problem category using OpenAI, and displays a dashboard with pain point distribution, sentiment analysis, and estimated deflection impact.

**2. Support Agent**
A chat interface where users describe their problem. The agent classifies it, searches a knowledge base (ChromaDB), generates a response, and decides whether to resolve automatically or escalate to a human. Every reasoning step is visible in the UI.

---

## Why I built this

I noticed InfinitePay has recurring complaints on Google Play — account blocks, app crashes, chargebacks. Instead of guessing, I scraped the data, classified it, and built a system that addresses the top issues automatically.

The goal: show CloudWalk I can identify real pain points, build AI tooling around them, and measure actual impact.

---

## Architecture

```
Google Play
    ↓
scraper.py → google-play-scraper
    ↓
classifier.py → OpenAI gpt-4o-mini (batch classification)
    ↓
SQLite (reviews + conversations)
    ↓
FastAPI (main.py)
    ↓
React + Vite (Vercel)
```

**Agent pipeline:**
```
User message
    ↓
[1] Classify → { category, confidence }  — gpt-4o-mini
    ↓
[2] Search KB → top 3 chunks by similarity  — ChromaDB + text-embedding-3-small
    ↓
[3] Decide: similarity ≥ 0.40 AND confidence ≥ 0.65 → resolve | otherwise → escalate
    ↓
[4] Generate response using KB context  — gpt-4o-mini
    ↓
Save { escalated: bool } to SQLite → deflection rate metric
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Backend | FastAPI + Python 3.12 |
| LLM | OpenAI gpt-4o-mini |
| Embeddings | text-embedding-3-small |
| Vector DB | ChromaDB (embedded) |
| Structured data | SQLite |
| Scraping | google-play-scraper |
| Frontend | React + Vite |
| Deploy | Render (backend) + Vercel (frontend) |

---

## Architecture decisions

**No LangChain** — agent logic written directly in Python. Every step is explicit and easy to explain.

**No n8n** — automation implemented in FastAPI, not a workflow tool.

**Batch + parallel classification** — instead of 1 OpenAI call per review, batches of 20 run in parallel via `ThreadPoolExecutor`. Reduces 200 API calls to ~10 concurrent requests.

**ChromaDB embedded** — runs in the same process as FastAPI. No external vector DB service needed. KB is regenerated automatically on cold start (21 topics, ~5s).

**SQLite for reviews** — structured data (filter, count, group). ChromaDB only for semantic search.

**gpt-4o-mini** — keeps API costs low. Classification + response generation for 100 reviews costs under $0.01.

**Deflection rate as real data** — every agent conversation is saved. The dashboard metric reflects actual agent performance, not a hardcoded number.

---

## How to run locally

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env with your OpenAI key
echo "OPENAI_API_KEY=sk-..." > .env

# Start server
uvicorn main:app --reload --port 8000
```

The KB is generated automatically on first startup. To regenerate manually:

```bash
python kb_setup.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Deflection rate

Every time the agent processes a message, it saves `{ escalated: bool }` to SQLite.

```
deflection_rate = (total resolved / total conversations) * 100
```

This is real data — not hardcoded. It reflects actual agent performance and appears on the dashboard after the first conversations.

---

## Project structure

```
infiniteiq/
├── backend/
│   ├── main.py          # FastAPI + endpoints
│   ├── scraper.py       # Google Play scraper
│   ├── classifier.py    # Batch classification via OpenAI
│   ├── agent.py         # 4-step agent pipeline
│   ├── kb_setup.py      # ChromaDB population
│   ├── database.py      # SQLite helpers
│   ├── kb.json          # 21 InfinitePay knowledge base topics
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/
        │   ├── Hero.jsx
        │   ├── Dashboard.jsx
        │   └── Agent.jsx
        └── App.jsx
```

---

Built by [Wesley Ryan](https://github.com/Ryan-Wes) · Case study for CloudWalk
