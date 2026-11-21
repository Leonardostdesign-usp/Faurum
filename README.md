# Próximo deploy (após editar código)
npm run deploy

# Testar localmente com banco de dev
npm run dev  # → http://localhost:8788

# Ajustar datas: editar shared/config.js e fazer npm run deploy

# Exportar dados ao final da semana
node --env-file=.env scripts/export.js --prod

# Moderar (ocultar resposta ofensiva)
node --env-file=.env scripts/moderate.js --prod hide <id_da_resposta>




# Faurum

Fórum de perguntas rotativas desenvolvido para a disciplina **AUH2820 — Cultura Urbana na Contemporaneidade** (Profª Dra. Giselle Beiguelman, FAUUSP). Alunos de Arquitetura (período integral) e Design (período noturno) respondem a perguntas curtas durante a semana da intervenção, via QR Code exibido na TV do museu da FAU.

**URL de produção:** https://faurum-1al.pages.dev

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite (JavaScript puro, sem TypeScript) |
| Roteamento | react-router-dom v6 |
| Backend | Cloudflare Pages Functions (`functions/`) |
| Banco de dados | Turso (libSQL) |
| ORM / query | SQL puro, consultas parametrizadas |
| Fingerprint | @fingerprintjs/fingerprintjs (open-source) |
| Estilo | CSS com variáveis (tokens do Figma, sem Tailwind) |
| Hospedagem | Cloudflare Pages |

---

## Pré-requisitos

- Node.js 18+ e npm
- Conta Cloudflare com o projeto `faurum` já criado
- Dois bancos Turso: `faurum-dev` (desenvolvimento) e `faurum` (produção)
- Wrangler instalado como devDependency (`npx wrangler`)

---

## Configuração Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar o arquivo `.env` (scripts Node e banco de dados)
Copie o arquivo de exemplo e preencha com as credenciais dos dois bancos Turso:
```bash
cp .env.example .env
```

Edite `.env` com as credenciais reais:
```
TURSO_DEV_DATABASE_URL=libsql://faurum-dev-...
TURSO_DEV_AUTH_TOKEN=...
TURSO_DATABASE_URL=libsql://faurum-...
TURSO_AUTH_TOKEN=...
```

### 3. Criar o arquivo `.dev.vars` (Wrangler dev server)
O `.dev.vars` aponta para o banco de **dev** e é lido pelo `wrangler pages dev`:
```bash
node -e "
  const fs = require('fs');
  const env = fs.readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.startsWith('TURSO_DEV_'));
  const vars = env.map(l => l.replace('TURSO_DEV_', 'TURSO_')).join('\n');
  fs.writeFileSync('.dev.vars', vars);
  console.log('.dev.vars criado com as credenciais de dev.');
"
```

### 4. Aplicar o schema no banco de dev
```bash
node --env-file=.env scripts/apply-schema.js
```

---

## Desenvolvimento

```bash
npm run dev
```

Um único comando sobe dois processos em paralelo:
- **Vite** (`web`) em `http://localhost:5173` — front-end com HMR (atualização instantânea ao editar `src/`).
- **Wrangler Pages Functions** (`api`) em `http://localhost:8788` — API + banco de dev, lendo `.dev.vars`.

Abra **`http://localhost:5173`** no navegador (não o 8788). O Vite faz proxy de `/api/*` para o Wrangler, então o front e a API funcionam juntos no mesmo endereço.

> Notas:
> - Se a pasta `dist/` não existir, o script `dev` cria ela automaticamente (sem sobrescrever um build existente).
> - Mudanças em `functions/` e `shared/` são recarregadas pelo Wrangler; se algo não refletir, reinicie o `npm run dev`.
> - Scripts separados: `npm run dev:vite` (só Vite) e `npm run dev:api` (só Wrangler/Functions). O fallback antigo está em `npm run dev:build`.
> - Em desenvolvimento local, o cookie de sessão não usa a flag `Secure` (para funcionar em `http://localhost`); em produção, `Secure` só é aplicado quando `ENVIRONMENT=production`.

---

## Testes

```bash
# Executa a suíte completa (18 testes: fases, nicks, DB, votos, accordion, delete)
# Requer conexão com o faurum-dev
node --env-file=.env scripts/test-suite.js
```

---

## Build e Deploy

```bash
# Build + deploy direto para o Cloudflare Pages (produção)
npm run deploy

# Ou em dois passos separados:
npm run build
npx wrangler pages deploy dist --project-name faurum
```

> **Atenção:** para o deploy funcionar, o Wrangler precisa estar autenticado.
> Execute `npx wrangler login` antes do primeiro deploy.

---

## Ajustar Datas e Fases

Edite [`shared/config.js`](shared/config.js):

```js
export const PHASES = {
  topic1: {
    start: new Date('2026-11-30T06:00:00-03:00'),  // ← altere aqui
    end:   new Date('2026-12-01T10:00:00-03:00'),  // ← e aqui
  },
  topic2: {
    start: new Date('2026-12-01T10:00:00-03:00'),
    end:   new Date('2026-12-02T23:59:59-03:00'),
  },
};
```

As fases são:
| Fase | Comportamento |
|---|---|
| `before` | Plataforma fechada, apenas tela de espera |
| `topic1` | Apenas Tópico 1 visível e postável |
| `topic2` | Apenas Tópico 2 visível (Tópico 1 oculto) |
| `closed` | Ambos os tópicos visíveis em modo leitura (abas) |

> Para testes, é possível forçar uma fase específica sem remover a tela "A plataforma ainda não está aberta" do código:
> - **Mais simples (recomendado):** `FORCE_PHASE=topic1` (valores: `before`, `topic1`, `topic2`, `closed`).
> - **Alternativa por data/hora:** `NOW_OVERRIDE=2026-12-01T14:00:00-03:00` força o relógio de referência.
> - **Local (`.dev.vars`):** funciona em ambiente não-produção; reinicie o `wrangler pages dev` após alterar.
> - **Produção (`*.pages.dev`) de forma controlada:** defina `ALLOW_PHASE_OVERRIDE=true` **e** `FORCE_PHASE=...` nas variáveis de ambiente de **Production** no Cloudflare Pages. Enquanto estiverem definidos, a fase será forçada para todos que acessarem. **Para voltar ao normal:** remova `ALLOW_PHASE_OVERRIDE`, `FORCE_PHASE` e `NOW_OVERRIDE` — o calendário real volta a valer e a tela `before` reaparece quando a fase for `before`.
> 
> Para testar localmente com a API/Functions, use `npm run build && npm run dev` e abra `http://localhost:8788`. Para confirmar a fase aplicada em qualquer ambiente, consulte `GET /api/state`.

---

## Variáveis de Ambiente em Produção

As variáveis de produção devem estar configuradas no Cloudflare Pages (Production):

| Variável | Fonte |
|---|---|
| `TURSO_DATABASE_URL` | Cloudflare Pages Secrets |
| `TURSO_AUTH_TOKEN` | Cloudflare Pages Secrets |
| `ENVIRONMENT` | `production` (ativa cookie `Secure` e guards de produção) |

Para atualizar os segredos:
```bash
node --env-file=.env scripts/set-pages-secrets.js
```

---

## Scripts de Manutenção

Todos os scripts aceitam a flag `--prod` para operar no banco de produção.
O banco de dev é sempre o padrão. Com `--prod`, o script pede confirmação (`faurum`).

| Comando | Descrição |
|---|---|
| `node --env-file=.env scripts/export.js` | Exporta dados (CSV + JSON) para `exports/` |
| `node --env-file=.env scripts/export.js --prod` | Exporta do banco de produção |
| `node --env-file=.env scripts/apply-schema.js` | Aplica schema no banco de dev |
| `node --env-file=.env scripts/apply-schema.js --prod` | Aplica schema em produção |
| `node --env-file=.env scripts/moderate.js --help` | Exibe ajuda de moderação |
| `node --env-file=.env scripts/db-destroy.js` | Destrói e recria o banco de dev |

---

## Exportação de Dados

```bash
# Exportar do banco de dev
node --env-file=.env scripts/export.js

# Exportar do banco de produção
node --env-file=.env scripts/export.js --prod
```

Os arquivos exportados (CSV e JSON) são gravados em `exports/` com timestamp no nome.
O export não inclui campos sensíveis (IP, fingerprint, hash de sessão).

---

## Moderação

Ver [`docs/MODERACAO.md`](docs/MODERACAO.md) para comandos de moderação completos:
- Localizar usuário por nick
- Investigar contas relacionadas por IP ou fingerprint
- Ocultar / desocultar respostas via CLI
- Consultas SQL diretas no painel do Turso

---

## Destruição do Banco (cuidado!)

```bash
# Destrói o banco de DEV (pede confirmação, verifica export recente)
node --env-file=.env scripts/db-destroy.js

# Destrói o banco de PRODUÇÃO (pede "faurum" + confirmação dupla)
node --env-file=.env scripts/db-destroy.js --prod
```

---

## Schema do Banco

Ver [`db/schema.sql`](db/schema.sql).

Tabelas:
- `users` — nick, curso, IP, fingerprint (hash), token de sessão (hash SHA-256)
- `replies` — respostas e threads (parent_id para hierarquia), soft-delete via `deleted_at`
- `votes` — controle de upvote/downvote (uma linha por user+reply, substituível)

---

## Estrutura do Projeto

```
Faurum/
├── db/
│   └── schema.sql            # Schema idempotente (CREATE TABLE IF NOT EXISTS)
├── docs/
│   └── MODERACAO.md          # Guia de moderação e consultas SQL
├── exports/                  # Arquivos exportados (CSV/JSON) — no .gitignore
├── functions/
│   └── api/
│       ├── archive.js        # GET /api/archive
│       ├── me.js             # GET /api/me
│       ├── state.js          # GET /api/state
│       ├── users.js          # POST /api/users
│       └── replies/
│           ├── index.js      # GET + POST /api/replies
│           └── [id]/
│               ├── index.js  # GET, PATCH, DELETE /api/replies/:id
│               └── vote.js   # PUT /api/replies/:id/vote
├── public/
│   ├── _redirects            # SPA fallback para Cloudflare Pages
│   └── favicon.svg
├── scripts/
│   ├── lib/db.js             # Cliente Turso para scripts Node
│   ├── apply-schema.js       # Aplica schema no banco
│   ├── db-destroy.js         # Destrói banco (dev ou prod)
│   ├── export.js             # Exporta dados para CSV/JSON
│   ├── moderate.js           # CLI de moderação
│   ├── set-pages-secrets.js  # Atualiza segredos no Cloudflare Pages
│   └── test-suite.js         # Suíte de testes automatizados
├── shared/
│   ├── auth.js               # Sessão, hashing, validação de nick/curso
│   ├── config.js             # Fases, tópicos, NOW_OVERRIDE/FORCE_PHASE/ALLOW_PHASE_OVERRIDE
│   ├── db.js                 # Cliente Turso para Cloudflare Functions
│   ├── relative-time.js      # Tempo relativo em PT-BR
│   ├── replies-helper.js     # SQL e formatação de respostas
│   └── response.js           # Helpers de resposta JSON
├── src/
│   ├── components/           # Header, Footer, Snackbar, Modais, ReplyCard
│   ├── context/AppContext.jsx
│   ├── hooks/                # useFingerprint, useCountdown
│   ├── pages/                # ForumPage, ThreadPage, AboutPage, PrivacyPage
│   ├── styles/               # tokens.css, global.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example              # Exemplo de variáveis (sem valores)
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── wrangler.toml
```
