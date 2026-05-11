import os
import sys
import json
import httpx
from openai import OpenAI

# SSL workaround: only needed on Windows (certificate chain issue)
# On Linux (Render), uses default SSL
if sys.platform == "win32":
    _http_client = httpx.Client(verify=False)
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"], http_client=_http_client)
else:
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

CATEGORIES = ["saque", "cobrança indevida", "cadastro", "maquininha", "atendimento", "outros"]

BATCH_SYSTEM_PROMPT = """Você é um classificador de reviews do app InfinitePay.
Receberá uma lista de reviews numerados. Para cada um, retorne um JSON array com objetos contendo:
- "category": uma das opções: saque, cobrança indevida, cadastro, maquininha, atendimento, outros
- "sentiment": uma das opções: positive, negative, neutral

Responda APENAS com o JSON array, sem markdown, sem explicação.
Exemplo: [{"category":"saque","sentiment":"negative"},{"category":"outros","sentiment":"positive"}]"""


def classify_batch(reviews: list[str]) -> list[dict]:
    """Classifica uma lista de reviews em uma única chamada à OpenAI."""
    numbered = "\n".join(f"{i+1}. {r[:300]}" for i, r in enumerate(reviews))

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": BATCH_SYSTEM_PROMPT},
            {"role": "user", "content": numbered},
        ],
        temperature=0,
        max_tokens=len(reviews) * 30,
    )

    text = response.choices[0].message.content.strip()
    results = json.loads(text)

    output = []
    for r in results:
        category = r.get("category", "outros")
        sentiment = r.get("sentiment", "neutral")
        if category not in CATEGORIES:
            category = "outros"
        if sentiment not in ("positive", "negative", "neutral"):
            sentiment = "neutral"
        output.append({"category": category, "sentiment": sentiment})

    # Garante que retorna o mesmo número de itens da entrada
    while len(output) < len(reviews):
        output.append({"category": "outros", "sentiment": "neutral"})

    return output


def classify(content: str) -> dict:
    """Classifica um único review (mantido para compatibilidade)."""
    return classify_batch([content])[0]
