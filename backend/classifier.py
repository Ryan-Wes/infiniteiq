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

CATEGORIES = ["app", "maquininha", "conta", "recebimento", "cobrança", "atendimento", "outros"]

BATCH_SYSTEM_PROMPT = """Você classifica reviews do app InfinitePay no Google Play.

CATEGORIAS — use o PRINCIPAL problema do review:

"app" → problemas com o aplicativo em si:
  - trava, fecha sozinho, lento, não abre, bug, UX ruim, tela preta
  - ex: "o app trava toda hora", "fica fechando", "interface confusa"

"maquininha" → problemas com o APARELHO FÍSICO de pagamento:
  - maquininha não liga, não aceita cartão, problema de hardware
  - ex: "a maquininha não funciona", "aparelho com defeito"

"conta" → problemas de acesso ou bloqueio de conta:
  - conta bloqueada, suspensa, sem acesso, verificação de identidade, login
  - ex: "bloquearam minha conta", "não consigo entrar", "pediram documentos"

"recebimento" → dinheiro não chegou ou foi retido:
  - valor não caiu, prazo errado, saque bloqueado, antecipação com problema
  - dinheiro transferido sem autorização, recebíveis retidos
  - ex: "meu dinheiro não caiu", "valor retido sem motivo", "não consigo sacar"

"cobrança" → valor cobrado ou debitado incorretamente:
  - taxa cobrada errada, desconto indevido, cobrança inesperada
  - NÃO inclui apenas reclamação de "taxa cara" — isso é "outros"
  - ex: "cobraram taxa que não era pra cobrar", "debitaram valor errado"

"atendimento" → suporte ruim ou inexistente:
  - não respondem, demora, só robô, atendimento péssimo
  - ex: "suporte não resolve nada", "impossível falar com humano"

"outros" → não se encaixa acima:
  - elogio geral, taxa cara sem erro, sugestão de melhoria, link de pagamento com UX ruim
  - ex: "taxa muito cara", "poderia ter mais funções", "app bom mas taxas altas"

SENTIMENT — tom GERAL do review:
  "negative" → frustração ou reclamação dominante, mesmo que comece com elogio
  "positive" → satisfação geral
  "neutral" → sugestão neutra sem reclamação forte

Nota 1-2 estrelas → quase sempre "negative".
Começa bem mas termina em reclamação → "negative".

Responda APENAS com JSON array, sem markdown.
Exemplo: [{"category":"app","sentiment":"negative"},{"category":"outros","sentiment":"positive"}]"""


def classify_batch(reviews: list[str]) -> list[dict]:
    """Classifica uma lista de reviews em uma única chamada à OpenAI."""
    numbered = "\n".join(f"{i+1}. {r[:600]}" for i, r in enumerate(reviews))

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
