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
- `JWT_SECRET` (obrigatorio para assinar/validar tokens)
- `JWT_EXPIRES_IN` (opcional, padrao `12h`)

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

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/employees` (admin)
- `GET /api/employees/:id`
- `GET /api/employees/:id/balance/:year`
- `PUT /api/employees/:id/balance/:year` (admin ajusta total/usado)
- `GET /api/employees/:id/vacations`
- `GET /api/vacations?status=APPROVED&employeeId=1&from=2026-01-01&to=2026-12-31`
- `POST /api/vacations` (colaborador programa as proprias ferias)
- `DELETE /api/vacations/:id` (remove do calendario, vira CANCELLED)
- `GET /api/vacations/audit` (log de inclusao/remocao no calendario)

## Regras de negocio implementadas

- autenticacao com JWT e perfis `ADMIN`/`EMPLOYEE`
- colaborador programa as proprias ferias (sem fluxo de aprovacao por gestor)
- valida saldo suficiente no momento da programacao
- bloqueia sobreposicao com periodos ja programados do mesmo colaborador
- calcula `requested_days` em **dias uteis** (segunda a sexta)
- registra auditoria de inclusao/remocao no calendario (`vacation_audit_log`)

## Credencial seed para testes

- E-mail: `luana.gualberto@nubank.com.br`
- Senha: `Nubank@123`
