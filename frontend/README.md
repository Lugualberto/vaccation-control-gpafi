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
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
