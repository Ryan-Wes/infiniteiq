from google_play_scraper import reviews, Sort

APP_ID = "io.cloudwalk.infinitepaydash"


def fetch_reviews(count: int = 200) -> list[dict]:
    """
    Busca reviews do InfiniteIQ no Google Play.
    Prioriza notas baixas (1-3 estrelas) para capturar problemas reais.
    Divide a cota: 60% notas baixas, 40% mais recentes.
    """
    low_count = int(count * 0.6)   # 120 reviews de nota 1-3
    recent_count = count - low_count  # 80 reviews mais recentes

    all_reviews = []
    seen_ids = set()

    # Notas baixas: 1, 2 e 3 estrelas
    for score in [1, 2, 3]:
        result, _ = reviews(
            APP_ID,
            lang="pt",
            country="br",
            sort=Sort.MOST_RELEVANT,
            count=low_count // 3,
            filter_score_with=score,
        )
        for r in result:
            if r.get("content") and r["reviewId"] not in seen_ids:
                seen_ids.add(r["reviewId"])
                all_reviews.append(r)

    # Reviews mais recentes (qualquer nota)
    result, _ = reviews(
        APP_ID,
        lang="pt",
        country="br",
        sort=Sort.NEWEST,
        count=recent_count,
    )
    for r in result:
        if r.get("content") and r["reviewId"] not in seen_ids:
            seen_ids.add(r["reviewId"])
            all_reviews.append(r)

    return [
        {
            "review_id": r["reviewId"],
            "author": r["userName"],
            "score": r["score"],
            "content": r["content"] or "",
        }
        for r in all_reviews
    ]
