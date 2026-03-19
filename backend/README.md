# Backend - Controle de Ferias

## 1) Configuracao

Copie o arquivo de exemplo de ambiente:

```bash
cp .env.example .env
```

Ajuste as variaveis Oracle no `.env`:

- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_CONNECT_STRING` (ex.: `localhost:1521/FREEPDB1`)

## 2) Criar schema e seed no Oracle

Execute os scripts da pasta `db/` no seu Oracle (SQL*Plus, SQLcl ou SQL Developer):

```sql
@db/schema.sql
@db/seed.sql
```

## 3) Rodar a API

```bash
npm install
npm run dev
```

API base: `http://localhost:3000/api`

## Endpoints principais

- `GET /api/employees`
- `GET /api/employees/:id`
- `GET /api/employees/:id/balance/:year`
- `GET /api/employees/:id/vacations`
- `GET /api/vacations?status=PENDING&employeeId=1&from=2026-01-01&to=2026-12-31`
- `POST /api/vacations`
- `PUT /api/vacations/:id/approve`
- `PUT /api/vacations/:id/reject`
