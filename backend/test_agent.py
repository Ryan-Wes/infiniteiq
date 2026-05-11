from dotenv import load_dotenv
load_dotenv()

from agent import run_agent

messages = [
    "minha conta foi bloqueada e tenho dinheiro retido",
    "o app fica fechando sozinho no meu celular",
    "como faço para contestar uma cobrança indevida",
    "qual o limite de saque diário",
    "meu cliente não consegue pagar pelo link",
]

for msg in messages:
    print(f"\n{'='*60}")
    print(f"MENSAGEM: {msg}")
    result = run_agent(msg)
    print(f"CATEGORIA: {result['category']} | ESCALOU: {result['escalate']}")
    for r in result["reasoning"]:
        print(f"  [{r['step']}] {r['detail']}".encode('ascii', 'replace').decode())
    print(f"RESPOSTA: {result['response'][:150]}...")
