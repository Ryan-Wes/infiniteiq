import os
import sys
import json
import httpx
import chromadb
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

if sys.platform == "win32":
    _http_client = httpx.Client(verify=False)
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"], http_client=_http_client)
else:
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "infiniteiq_kb"


def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def setup_kb():
    with open("kb.json", "r", encoding="utf-8") as f:
        kb = json.load(f)

    chroma = chromadb.PersistentClient(path=CHROMA_PATH)

    # Recria a coleção do zero
    try:
        chroma.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = chroma.create_collection(COLLECTION_NAME)

    print(f"Gerando embeddings para {len(kb)} tópicos...")
    for i, item in enumerate(kb):
        text = f"{item['topic']}: {item['content']}"
        embedding = get_embedding(text)
        collection.add(
            ids=[str(i)],
            embeddings=[embedding],
            documents=[item["content"]],
            metadatas=[{"topic": item["topic"]}],
        )
        print(f"  [{i+1}/{len(kb)}] {item['topic']}")

    print(f"\nKB populada com {len(kb)} chunks no ChromaDB.")


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    setup_kb()
