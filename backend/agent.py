import os
import sys
import json
import httpx
import chromadb
from openai import OpenAI

if sys.platform == "win32":
    _http_client = httpx.Client(verify=False)
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"], http_client=_http_client)
else:
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "infiniteiq_kb"

CATEGORIES = ["app", "maquininha", "conta", "recebimento", "cobrança", "atendimento", "outros"]

SIMILARITY_THRESHOLD = 0.40
CONFIDENCE_THRESHOLD = 0.65


def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def parse_json(text: str) -> dict:
    """Remove markdown code blocks e faz o parse do JSON."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def classify_message(message: str) -> dict:
    prompt = f"""Classifique a mensagem do usuário em uma categoria de problema do app InfinitePay.
Retorne APENAS um JSON com:
- "category": uma das opções: {', '.join(CATEGORIES)}
- "confidence": número de 0 a 1 indicando sua certeza

Mensagem: "{message}"
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=80,
    )
    result = parse_json(response.choices[0].message.content)
    category = result.get("category", "outros")
    confidence = float(result.get("confidence", 0.5))
    if category not in CATEGORIES:
        category = "outros"
    return {"category": category, "confidence": confidence}


def search_kb(message: str, n_results: int = 3) -> list[dict]:
    chroma = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = chroma.get_collection(COLLECTION_NAME)
    embedding = get_embedding(message)
    results = collection.query(
        query_embeddings=[embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )
    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        # ChromaDB retorna distância L2 — convertemos para similaridade (0-1)
        similarity = max(0.0, 1.0 - dist / 2.0)
        chunks.append({
            "topic": meta["topic"],
            "content": doc,
            "similarity": round(similarity, 3),
        })
    return chunks


def generate_response(message: str, chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"[{c['topic']}]\n{c['content']}" for c in chunks
    )
    prompt = f"""Você é um assistente de suporte do InfinitePay. Responda à dúvida do usuário de forma clara, objetiva e amigável, usando APENAS as informações do contexto abaixo.

Se a informação não estiver no contexto, diga que não tem essa informação e sugira entrar em contato com o suporte.

Contexto:
{context}

Pergunta do usuário: {message}

Resposta:"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=400,
    )
    return response.choices[0].message.content.strip()


def run_agent(message: str) -> dict:
    reasoning = []

    # Passo 1 — Classificação
    classification = classify_message(message)
    reasoning.append({
        "step": "Classificação",
        "detail": f"Problema identificado: {classification['category']} (confiança: {int(classification['confidence'] * 100)}%)",
    })

    # Passo 2 — Busca na KB
    chunks = search_kb(message)
    best_similarity = chunks[0]["similarity"] if chunks else 0
    reasoning.append({
        "step": "Busca na base de conhecimento",
        "detail": f"{len(chunks)} tópicos relevantes encontrados — similaridade mais alta: {int(best_similarity * 100)}%",
    })

    # Passo 3 — Decisão
    should_resolve = (
        best_similarity >= SIMILARITY_THRESHOLD
        and classification["confidence"] >= CONFIDENCE_THRESHOLD
    )
    reasoning.append({
        "step": "Decisão",
        "detail": (
            f"Confiança alta e base de conhecimento relevante → resolvendo automaticamente"
            if should_resolve else
            f"Confiança ou similaridade insuficiente → escalando para atendimento humano"
        ),
    })

    # Passo 4 — Resposta ou escalação
    if should_resolve:
        response_text = generate_response(message, chunks)
        reasoning.append({
            "step": "Resposta",
            "detail": f"Resposta gerada com base em: {', '.join(c['topic'] for c in chunks[:2])}",
        })
    else:
        response_text = (
            "Entendo sua situação. Para garantir o melhor atendimento, vou encaminhar você para um de nossos especialistas. "
            "Por favor, entre em contato pelo chat do app em Ajuda > Falar com suporte, ou aguarde que um atendente entrará em contato em breve."
        )
        reasoning.append({
            "step": "Escalação",
            "detail": "Mensagem encaminhada para atendimento humano",
        })

    return {
        "response": response_text,
        "escalate": not should_resolve,
        "category": classification["category"],
        "reasoning": reasoning,
    }
