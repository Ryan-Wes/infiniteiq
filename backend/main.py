import os
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, save_review, get_stats, clear_reviews
from scraper import fetch_reviews
from classifier import classify_batch

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


def process_batch(batch: list[dict]) -> list[tuple]:
    """Classifica um lote e retorna pares (review, classificação)."""
    classifications = classify_batch([r["content"] for r in batch])
    return list(zip(batch, classifications))


@app.post("/reviews/scrape")
def scrape_reviews(count: int = 100, reset: bool = False):
    if reset:
        clear_reviews()
    raw = fetch_reviews(count)

    # Divide em lotes
    batches = [raw[i: i + BATCH_SIZE] for i in range(0, len(raw), BATCH_SIZE)]

    # Processa todos os lotes em paralelo
    results = []
    with ThreadPoolExecutor(max_workers=len(batches)) as executor:
        futures = {executor.submit(process_batch, b): b for b in batches}
        for future in as_completed(futures):
            try:
                results.extend(future.result())
            except Exception:
                continue

    # Salva no banco
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
