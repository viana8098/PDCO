# Painel de Cultura Organizacional (PDCO)

Versão web independente do módulo PDCO da Plataforma de Gestão Estratégica —
mesmo padrão do PPR e do PRESIDENTE: **sem backend em produção**. O backend
NestJS só roda local (contra o dw corporativo real) para gerar um snapshot
estático; o deploy no Cloudflare Pages serve esse snapshot através de
Functions leves, sem nenhuma conexão de banco em produção.

```
pdco/
├── data/sql/            # DDL da tabela de registro qualitativo (referência)
├── backend-pdco/        # API NestJS — só local, gera o snapshot
└── frontend-pdco/       # SPA React + Vite (SPA hash-router)
    ├── functions/api/pdco/**   # Cloudflare Pages Functions — leem o snapshot estático
    ├── scripts/gerar-snapshot.mjs
    └── public/_data/pdco/      # snapshot gerado (versionado no git)
```

## Diferenças em relação ao módulo original (Plataforma de Gestão)

Esta versão é uma vitrine pessoal, sem os sistemas corporativos por trás:

- **Sem iDigital / sem login** — não há gestor x administrador; a API
  sempre responde com a visão consolidada (todos os planos).
- **Registro qualitativo somente-leitura** — sem backend real em produção,
  não há como persistir "pontos críticos / fatores de sucesso / itens fora
  do escopo". Os campos aparecem preenchidos (se o snapshot tiver dado) mas
  desabilitados.
- **Indicadores/KR** seguem best-effort (vazio), igual ao módulo original.

Tudo o resto — fonte de dados (`dw.fato_planejamento_planodeacao` e
`dw.fato_planejamento_acompanhamentosplanodeacao`), regras de execução, RAG
e a janela de acompanhamento de 8 meses — é o mesmo código, adaptado.

## Como rodar local

Pré-requisitos: Node.js 18+ e rede até o SQL Server do dw (só para gerar/
atualizar o snapshot — depois de gerado, o frontend funciona sem rede
nenhuma).

### 1. Backend (só para gerar o snapshot)

```bash
cd backend-pdco
npm install
copy .env.example .env      # preencha SQL_SERVER/SQL_USER/SQL_PASSWORD
npm run start:dev
```

### 2. Gerar o snapshot

Com o backend rodando (passo acima), em outro terminal:

```bash
cd frontend-pdco
npm install
npm run gerar-snapshot
```

Isso grava `frontend-pdco/public/_data/pdco/*.json`. Rode de novo sempre que
quiser atualizar os dados (ex.: novo mês carregado no dw).

### 3. Frontend

```bash
cd frontend-pdco
npm run dev
```

Abre em `http://localhost:5175`. Em dev, o Vite faz proxy de `/api` para o
backend local (porta 8020) — não depende do snapshot ainda gerado.

## Deploy (Cloudflare Pages)

1. Gere o snapshot mais recente (passo 2 acima) e commit o `public/_data/pdco/`.
2. Conecte este repositório ao Cloudflare Pages.
   - Diretório raiz do build: `frontend-pdco`
   - Comando de build: `npm run build`
   - Diretório de saída: `dist`
3. O Cloudflare Pages detecta `frontend-pdco/functions/` automaticamente e
   publica cada rota como uma Function — nenhuma variável de ambiente de
   banco é necessária em produção (o snapshot já está no bundle).
