# Frontend - Controle de Ferias (React)

## Configuracao

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Por padrao:

```env
VITE_USE_MOCK_DATA=true
```

> A fase atual funciona totalmente sem Oracle/backend,
> com persistencia local no navegador (`localStorage`) para testes de UX.

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

- tema roxo inspirado no Nu + branding atualizado
- login de teste (mock) para validar interface sem dependencia do Oracle
- dashboard do colaborador com:
  - hero/banner com instrucoes internas
  - inclusao e remocao de periodos no calendario
  - selecao de tipo de evento (Ferias / Day Off)
  - validacao de conflito com backup (somente para Ferias)
  - chip informando backup do colaborador
  - filtro rapido: `Time inteiro` ou `So minhas ferias`
  - preenchimento manual do saldo do periodo aquisitivo
  - visualizacao das ferias/day offs dos colegas no calendario
  - visao de calendario em Month/Week/Day/Agenda/Year
  - sem validacao de saldo nesta fase de prototipo
- dashboard admin com:
  - calendario consolidado de periodos programados
  - filtro por colaborador e periodo
  - visao anual (Year)
  - formulario para ajustar saldo anual de ferias
  - tabela de auditoria (inclusao/remocao no calendario)

Observacao: a contagem exibida no modal considera **dias corridos** (apenas informativo).

## Credenciais mock para teste

- `luana.gualberto@nubank.com.br` / `Nubank@123` (ADMIN)
- `rafael.oliveira@nubank.com.br` / `Nubank@123` (EMPLOYEE)
