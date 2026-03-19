# Frontend - Controle de Ferias (React)

## Configuracao

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Por padrao:

```env
VITE_API_URL=http://localhost:3000/api
```

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

## Funcionalidades da interface

- login real com e-mail/senha usando JWT
- dashboard do colaborador com saldo, inclusao e remocao de periodos no calendario
- dashboard admin com:
  - calendario consolidado de periodos programados
  - filtro por colaborador e periodo
  - formulario para ajustar saldo anual de ferias
  - tabela de auditoria (inclusao/remocao no calendario)

Observacao: a contagem exibida no modal e no backend considera **dias uteis** (segunda a sexta).
