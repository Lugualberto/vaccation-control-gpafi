# Frontend - Controle de Ferias (React)

## Configuracao

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Por padrao:

```env
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCK_DATA=true
```

> Com `VITE_USE_MOCK_DATA=true` (padrao), a interface funciona sem Oracle/backend,
> com persistencia local no navegador (`localStorage`) para testes de UX.
> Para usar API real, configure `VITE_USE_MOCK_DATA=false`.

## Rodar localmente

```bash
npm install
npm run dev
```

App em `http://localhost:5173`.

## Biblioteca de calendario utilizada

Foi utilizado `react-big-calendar` com localizacao `pt-BR` via `date-fns`.

Integração principal:

- Import do CSS no `src/main.jsx`.
- Configuração do localizer no arquivo `src/utils/calendar.js`.
- Uso do componente:

```jsx
<Calendar
  localizer={localizer}
  culture="pt-BR"
  events={events}
  startAccessor="start"
  endAccessor="end"
  selectable
/>
```

## Funcionalidades da interface (fase atual)

- login de teste (mock) para validar interface sem dependencia do Oracle
- dashboard do colaborador com:
  - inclusao e remocao de periodos no calendario
  - preenchimento manual do saldo do periodo aquisitivo
- dashboard admin com:
  - calendario consolidado de periodos programados
  - filtro por colaborador e periodo
  - formulario para ajustar saldo anual de ferias
  - tabela de auditoria (inclusao/remocao no calendario)

Observacao: a contagem exibida no modal considera **dias uteis** (segunda a sexta).

## Credenciais mock para teste

- `luana.gualberto@nubank.com.br` / `Nubank@123` (ADMIN)
- `rafael.oliveira@nubank.com.br` / `Nubank@123` (EMPLOYEE)
