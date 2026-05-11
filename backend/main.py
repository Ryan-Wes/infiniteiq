import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, save_review, get_stats
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


@app.post("/reviews/scrape")
def scrape_reviews(count: int = 200):
    raw = fetch_reviews(count)
    saved = 0

    # Processa em lotes de BATCH_SIZE (200 reviews = ~10 chamadas à OpenAI)
    for i in range(0, len(raw), BATCH_SIZE):
        batch = raw[i : i + BATCH_SIZE]
        try:
            classifications = classify_batch([r["content"] for r in batch])
            for r, cls in zip(batch, classifications):
                try:
                    save_review(
                        review_id=r["review_id"],
                        author=r["author"],
                        score=r["score"],
                        content=r["content"],
                        category=cls["category"],
                        sentiment=cls["sentiment"],
                    )
                    saved += 1
                except Exception:
                    continue
        except Exception:
            continue

    return {"scraped": len(raw), "saved": saved}


@app.get("/reviews/stats")
def reviews_stats():
    return get_stats()
