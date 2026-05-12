import sqlite3
from contextlib import contextmanager

DB_PATH = "infiniteiq.db"


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id TEXT UNIQUE,
                author TEXT,
                score INTEGER,
                content TEXT,
                category TEXT,
                sentiment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT,
                response TEXT,
                escalated INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def clear_reviews():
    with get_conn() as conn:
        conn.execute("DELETE FROM reviews")


def save_review(review_id: str, author: str, score: int, content: str, category: str, sentiment: str):
    with get_conn() as conn:
        conn.execute(
            """
            INSERT OR IGNORE INTO reviews (review_id, author, score, content, category, sentiment)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (review_id, author, score, content, category, sentiment),
        )


def get_stats():
    with get_conn() as conn:
        categories = conn.execute("""
            SELECT category, COUNT(*) as count,
                   AVG(CASE sentiment WHEN 'positive' THEN 1 WHEN 'neutral' THEN 0 ELSE -1 END) as avg_sentiment
            FROM reviews
            GROUP BY category
            ORDER BY count DESC
        """).fetchall()

        samples = {}
        for row in categories:
            cat = row["category"]
            rows = conn.execute(
                """SELECT author, score, content, sentiment FROM reviews
                   WHERE category = ? ORDER BY score ASC""",
                (cat,),
            ).fetchall()
            all_reviews = [dict(r) for r in rows]
            samples[cat] = {
                "negative": [r for r in all_reviews if r["sentiment"] == "negative"],
                "positive": [r for r in all_reviews if r["sentiment"] == "positive"],
                "neutral":  [r for r in all_reviews if r["sentiment"] == "neutral"],
            }

        total_convs = conn.execute("SELECT COUNT(*) as n FROM conversations").fetchone()["n"]
        resolved = conn.execute("SELECT COUNT(*) as n FROM conversations WHERE escalated = 0").fetchone()["n"]

        deflection_rate = round((resolved / total_convs) * 100, 1) if total_convs > 0 else None

        return {
            "categories": [dict(r) for r in categories],
            "samples": samples,
            "deflection_rate": deflection_rate,
            "total_conversations": total_convs,
        }


def save_conversation(message: str, response: str, escalated: bool):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO conversations (message, response, escalated) VALUES (?, ?, ?)",
            (message, response, int(escalated)),
        )
