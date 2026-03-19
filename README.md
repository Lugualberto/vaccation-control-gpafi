# Sistema de Controle de Férias da Equipe

Projeto full-stack com:

- **Backend**: Node.js + Express
- **Frontend**: React (Vite) + react-big-calendar
- **Banco**: Oracle

## Estrutura

```text
.
├── backend
│   ├── db
│   │   ├── schema.sql
│   │   └── seed.sql
│   └── src
│       ├── config
│       ├── controllers
│       ├── middlewares
│       ├── routes
│       ├── services
│       └── utils
└── frontend
    └── src
        ├── api
        ├── components
        ├── contexts
        ├── pages
        └── utils
```

## Assunções da versão inicial

1. O período de férias deve começar e terminar no **mesmo ano**.
2. O cálculo de dias está em **dias corridos** (sem excluir finais de semana).
3. Apenas usuários com `ROLE = 'ADMIN'` podem aprovar/reprovar solicitações.

## Como rodar

### 1) Banco Oracle

No usuário/schema Oracle desejado, execute:

```sql
@backend/db/schema.sql
@backend/db/seed.sql
```

### 2) Backend

```bash
cd backend
cp .env.example .env
# ajustar variáveis ORACLE_*
npm install
npm run dev
```

API em `http://localhost:3000`.

### 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App em `http://localhost:5173`.
