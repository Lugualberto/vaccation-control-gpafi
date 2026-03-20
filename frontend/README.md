# Frontend - Team Vacation and Day Off Control (React)

## Configuration

Create `.env` from the example:

```bash
cp .env.example .env
```

Default values:

```env
VITE_USE_MOCK_DATA=true
VITE_CORPORATE_EMAIL_DOMAIN=nubank.com.br
VITE_SHARED_DB_API_BASE=https://mantledb.sh/v2/vaccation-control-gpafi
```

The current phase works without Oracle/backend and uses shared mock persistence
(with local fallback) for UX validation.

## Run locally

```bash
npm install
npm run dev
```

App URL: `http://localhost:5173`.

## Current UI capabilities

- Nu-inspired gradient layout + side hero image
- Corporate email login
- Employee dashboard:
  - Team calendar with Month/Week/Day/Agenda/Year views
  - Vacation and Day Off scheduling/removal
  - Backup conflict rule for vacations
  - Scope filter: whole team vs only my events
  - Manual annual vacation balance
  - Day Off duration (full day 8h or half day 4h)
  - Hour bank block for non-unlimited users (total, consumed, available)
- Admin dashboard:
  - Consolidated calendar and audit log
  - Backup assignment management
  - Annual vacation balance adjustment
  - Hour bank adjustment per employee
  - Remove any scheduled period

## GitHub Pages target URL

Production URL for repository `nubank/vaccation-control-gpafi`:

`https://nubank.github.io/vaccation-control-gpafi/#/admin`

## GitHub Pages deploy checklist (nubank/vaccation-control-gpafi)

1. In repository **Settings > Pages**, set source to **GitHub Actions**.
2. Ensure workflow `.github/workflows/deploy-frontend-pages.yml` is enabled.
3. Confirm environment `github-pages` allows deployments from the branch you use (for example `main` and/or `cursor/*`).
4. Push changes; the workflow builds the frontend and deploys `frontend/dist`.
5. Access the app at:
   - `https://nubank.github.io/vaccation-control-gpafi/`
   - routes under hash mode, e.g. `#/employee` and `#/admin`.

The workflow computes `VITE_BASE_PATH` automatically:
- owner site repo (`<owner>.github.io`) => `/`
- project repo (this case) => `/<repo>/`
