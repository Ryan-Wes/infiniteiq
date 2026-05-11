import os
import sys
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

SYSTEM_PROMPT = """Você é um classificador de reviews do app InfinitePay.
Dado o texto de um review, retorne EXATAMENTE um JSON com dois campos:
- "category": uma das opções: saque, cobrança indevida, cadastro, maquininha, atendimento, outros
- "sentiment": uma das opções: positive, negative, neutral

Responda APENAS com o JSON, sem markdown, sem explicação."""


def classify(content: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content[:500]},
        ],
        temperature=0,
        max_tokens=60,
    )
    import json
    text = response.choices[0].message.content.strip()
    result = json.loads(text)
    category = result.get("category", "outros")
    sentiment = result.get("sentiment", "neutral")
    if category not in CATEGORIES:
        category = "outros"
    if sentiment not in ("positive", "negative", "neutral"):
        sentiment = "neutral"
    return {"category": category, "sentiment": sentiment}
