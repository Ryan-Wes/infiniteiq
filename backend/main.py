import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, save_review, get_stats
from scraper import fetch_reviews
from classifier import classify

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
    for r in raw:
        try:
            classification = classify(r["content"])
            save_review(
                review_id=r["review_id"],
                author=r["author"],
                score=r["score"],
                content=r["content"],
                category=classification["category"],
                sentiment=classification["sentiment"],
            )
            saved += 1
        except Exception:
            continue
    return {"scraped": len(raw), "saved": saved}


@app.get("/reviews/stats")
def reviews_stats():
    return get_stats()
