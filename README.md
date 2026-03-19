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
2. O cálculo de dias está em **dias úteis** (segunda a sexta).
3. Nesta fase inicial, o frontend roda em **modo mock local** por padrão (`VITE_USE_MOCK_DATA=true`) para validar interface sem Oracle.
4. Cada colaborador pode preencher manualmente seu saldo do período aquisitivo para testes.
5. Não existe aprovação de gestor: o próprio funcionário programa/remove suas férias.
6. Inclusões/remocoes de calendário ficam registradas em auditoria.

## Como rodar

### 1) Frontend (modo teste sem Oracle)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App em `http://localhost:5173`.

### 2) Backend + Oracle (opcional nesta fase)

No usuário/schema Oracle desejado, execute:

```sql
@backend/db/schema.sql
@backend/db/seed.sql
```

### 3) Backend

```bash
cd backend
cp .env.example .env
# ajustar variáveis ORACLE_*
npm install
npm run dev
```

API em `http://localhost:3000`.
