import os
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import init_db, save_review, get_stats, clear_reviews, save_conversation
from scraper import fetch_reviews
from classifier import classify_batch
from agent import run_agent
from kb_setup import setup_kb

BATCH_SIZE = 20

app = FastAPI(title="InfiniteIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    # Gera KB automaticamente se não existir (necessário após cold start no Render)
    try:
        import chromadb
        chroma = chromadb.PersistentClient(path="./chroma_db")
        chroma.get_collection("infiniteiq_kb")
        print("KB já existe, pulando setup.")
    except Exception:
        print("KB não encontrada, gerando embeddings...")
        setup_kb()


# ── Reviews ──────────────────────────────────────────────

def process_batch(batch: list[dict]) -> list[tuple]:
    classifications = classify_batch([r["content"] for r in batch])
    return list(zip(batch, classifications))


@app.post("/reviews/scrape")
def scrape_reviews(count: int = 100, reset: bool = False):
    if reset:
        clear_reviews()
    raw = fetch_reviews(count)
    batches = [raw[i: i + BATCH_SIZE] for i in range(0, len(raw), BATCH_SIZE)]
    results = []
    with ThreadPoolExecutor(max_workers=len(batches)) as executor:
        futures = {executor.submit(process_batch, b): b for b in batches}
        for future in as_completed(futures):
            try:
                results.extend(future.result())
            except Exception:
                continue
    saved = 0
    for review, cls in results:
        try:
            save_review(
                review_id=review["review_id"],
                author=review["author"],
                score=review["score"],
                content=review["content"],
                category=cls["category"],
                sentiment=cls["sentiment"],
            )
            saved += 1
        except Exception:
            continue
    return {"scraped": len(raw), "saved": saved}


@app.get("/reviews/stats")
def reviews_stats():
    return get_stats()


# ── Knowledge Base ────────────────────────────────────────

@app.post("/kb/setup")
def kb_setup():
    setup_kb()
    return {"status": "KB populada com sucesso"}


# ── Agent ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


@app.post("/agent/chat")
def agent_chat(body: ChatRequest):
    result = run_agent(body.message)
    save_conversation(
        message=body.message,
        response=result["response"],
        escalated=result["escalate"],
    )
    return result
