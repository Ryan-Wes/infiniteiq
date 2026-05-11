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

## Dia 2 — Frontend e deploy

**Objetivo:** ter o frontend conectado ao backend com dados reais, deployado e acessível publicamente.

### O que foi feito

- Criado projeto React + Vite em `frontend/` com `react-router-dom`, `recharts` e `axios`
- Implementadas as páginas:
  - `Hero.jsx` — apresentação do projeto, pain points, como funciona, CTAs
  - `Dashboard.jsx` — gráfico de distribuição, sentimento por categoria, cards com reviews reais, métricas
  - `Agent.jsx` — placeholder para o Dia 3
- Deploy backend no Render: `https://infiniteiq-api.onrender.com`
- Deploy frontend no Vercel: `https://infiniteiq.vercel.app`

### Extras além do plano

- Cores na identidade da InfinitePay — gradiente amarelo → verde limão (`#c8ff00` → `#39e75f`)
- Fundo preto neutro `#0a0a0a` (evita o azul genérico de templates de IA)
- Animação de carregamento com overlay, spinner e mensagens rotativas durante o scraping
- Botão renomeado de "Novo Scraping" para "Atualizar avaliações" (linguagem do usuário comum)
- Reset automático do banco a cada nova busca (`?reset=true`)
- Estado vazio no dashboard com CTA para primeira busca
- Classificação em lotes paralelos: 200 chamadas individuais → 10 lotes de 20 em paralelo com `ThreadPoolExecutor`

### Problemas encontrados e soluções

| Problema | Causa | Solução |
|---|---|---|
| `/dashboard` retornando 404 no Vercel | Vercel não sabia rotear SPA — procurava arquivo físico `/dashboard` | Adicionado `frontend/vercel.json` com rewrite `"/(.*)" → "/index.html"` |
| Render não redesployava automaticamente | Free tier hiberna após 15 min sem requisição — não é bug | Comportamento esperado; primeira requisição acorda o servidor em ~30-60s |
| Scraping lento (~2 min para 200 reviews) | 200 chamadas à OpenAI em sequência | Batch de 20 reviews por chamada + execução paralela com `ThreadPoolExecutor` |
| Dashboard mostrando 200 reviews após mudar default para 100 | Banco de produção ainda tinha dados antigos | Adicionado parâmetro `?reset=true` que limpa o banco antes de raspar |

### Decisões técnicas

- **`ThreadPoolExecutor` para classificação paralela:** Python threads funcionam bem para I/O (HTTP). O GIL é liberado durante chamadas de rede, então os lotes rodam de fato em paralelo.
- **`reset=true` automático no botão:** o usuário não precisa saber que existe um banco — "Atualizar avaliações" sempre traz dados frescos.
- **Gradiente como identidade visual:** usar `linear-gradient(135deg, #c8ff00, #39e75f)` no logo, títulos e botões primários conecta o projeto visualmente à marca InfinitePay sem copiar o design deles.

### URLs de produção

| Serviço | URL |
|---|---|
| Frontend (Vercel) | https://infiniteiq.vercel.app |
| Backend (Render) | https://infiniteiq-api.onrender.com |

---

## Dia 3 — Agente com RAG e raciocínio visível

**Objetivo:** agente respondendo com base na KB, raciocínio visível no frontend.

### O que foi feito

- `kb.json` com 21 tópicos da documentação pública do InfinitePay
- `kb_setup.py` gerando embeddings (`text-embedding-3-small`) e populando ChromaDB
- `agent.py` com pipeline de 4 passos:
  1. Classificação da mensagem (categoria + confiança via gpt-4o-mini)
  2. Busca semântica na KB (ChromaDB, top 3 chunks por similaridade)
  3. Decisão: similaridade ≥ 40% e confiança ≥ 65% → resolve; senão → escala
  4. Geração de resposta com contexto da KB ou mensagem de escalação
- `POST /agent/chat` e `POST /kb/setup` adicionados ao `main.py`
- Página `Agent.jsx` com chat, sidebar de sugestões, painel de raciocínio expansível e badges verde/vermelho

### Testes realizados

| Mensagem | Comportamento |
|---|---|
| "n consigo enviar um pix" | Resolvido — similaridade 56%, resposta correta sobre Pix |
| "o app fica fechando sozinho" | Resolvido — similaridade 67%, solução de cache/reinstalação |
| "como contestar cobrança indevida" | Resolvido — similaridade 78%, resposta completa |
| "qual o limite de saque diário" | Resolvido — similaridade 68%, limites detalhados |
| "qual o resultado do jogo ontem" | Escalado — similaridade 24% (abaixo do threshold) ✅ |
| "o app do nubank é melhor?" | Resolvido com resposta neutra (não tem info sobre Nubank) |

### Problemas encontrados e soluções

| Problema | Causa | Solução |
|---|---|---|
| `chromadb` não instalava no Dia 1 | Faltava C++ Build Tools | Versão mais recente do ChromaDB tem wheels pré-compiladas — instalou sem problemas |
| `KeyError: OPENAI_API_KEY` no kb_setup | `client` instanciado antes do `load_dotenv()` | Movido `load_dotenv()` para o topo do arquivo |
| `JSONDecodeError` no classifier do agente | OpenAI retornava JSON com markdown (` ```json ``` `) | Adicionado `parse_json()` que strip markdown antes de parsear |

### Decisões técnicas

- **ChromaDB embedded:** roda no mesmo processo do FastAPI, sem servidor separado. Arquivos salvos em `./chroma_db/`. Em produção, os arquivos não persistem entre deploys no Render free tier — solução pendente para o Dia 4.
- **Thresholds de decisão:** similaridade 0.40 e confiança 0.65 — calibrados nos testes para equilibrar cobertura e precisão.
- **Painel de raciocínio:** elemento diferenciador do projeto — prova que é um agente com etapas de raciocínio, não apenas um chatbot.

---

## Dia 4 — (pendente)
