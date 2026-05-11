# InfiniteIQ — Dev Log

---

## Dia 1 — Backend e dados funcionando

**Objetivo:** ter reviews reais coletados, classificados e salvos no banco.

### O que foi feito

- Criada estrutura de pastas: `infiniteiq/backend/` e `infiniteiq/frontend/`
- Implementados os arquivos core do backend:
  - `scraper.py` — coleta reviews do Google Play
  - `classifier.py` — classifica categoria e sentimento via OpenAI
  - `database.py` — SQLite com tabelas `reviews` e `conversations`
  - `main.py` — FastAPI com os endpoints `POST /reviews/scrape` e `GET /reviews/stats`
- Scraper ajustado para buscar 60% de reviews com nota 1-3 estrelas + 40% mais recentes, capturando mais problemas reais
- 200 reviews coletados, classificados e salvos com sucesso
- Servidor rodando em `http://localhost:8000` com hot-reload

### Resultado dos dados (200 reviews)

| Categoria | Qtd | Sentimento médio |
|---|---|---|
| outros | 131 | neutro/misto |
| atendimento | 18 | negativo (-0.78) |
| cobrança indevida | 17 | negativo (-1.0) |
| maquininha | 16 | negativo (-0.69) |
| cadastro | 14 | negativo (-1.0) |
| saque | 4 | negativo (-1.0) |

### Problemas encontrados e soluções

| Problema | Causa | Solução |
|---|---|---|
| `scraped: 0` no primeiro run | App ID errado no scraper | ID correto descoberto via busca: `io.cloudwalk.infinitepaydash` |
| `TypeError: unexpected keyword argument 'proxies'` | Conflito entre `openai==1.51.0` e `httpx==0.28.x` | Atualizado para `openai>=2.0.0` |
| `SSL: CERTIFICATE_VERIFY_FAILED` | Certificado SSL do Windows sem cadeia completa | Adicionado `httpx.Client(verify=False)` no `classifier.py` |
| `Failed building wheel for chroma-hnswlib` | ChromaDB requer Microsoft C++ Build Tools no Windows | ChromaDB removido do Dia 1 — instalar apenas no Dia 3 |

### Decisões técnicas

- **`verify=False` no httpx:** workaround local para SSL. Em produção (Render), o ambiente Linux não tem esse problema — pode ser removido no deploy.
- **Scraper prioriza notas baixas:** reviews 1-3 estrelas têm mais conteúdo descritivo de problemas, o que alimenta melhor o dashboard e a KB do agente.
- **ChromaDB adiado para Dia 3:** não é necessário para scraping/dashboard. Evita bloqueio por dependência de build tools no Windows.

---

## Dia 2 — (em andamento)

---

## Dia 3 — (pendente)

---

## Dia 4 — (pendente)
