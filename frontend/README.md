# Frontend - Controle de Ferias (React)

## Configuracao

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Por padrao:

```env
VITE_USE_MOCK_DATA=true
VITE_GOOGLE_CLIENT_ID=seu_google_client_id.apps.googleusercontent.com
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
- login com Google (Google Identity) para identificar usuario autenticado
- dashboard do colaborador com:
  - hero em layout dividido com texto + ilustração lateral
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

## Configuração do login Google (resumo)

Variável necessária:

- `VITE_GOOGLE_CLIENT_ID`: Client ID OAuth Web criado no Google Cloud Console.

Arquivos alterados para o fluxo:

- `src/main.jsx` (provider do Google)
- `src/pages/LoginPage.jsx` (botão "Entrar com Google")
- `src/contexts/AuthContext.jsx` (persistência do usuário autenticado)
- `src/api/mockApi.js` e `src/api/client.js` (login local com perfil vindo do Google)
