# AGENTS.md

Project: **Cebra / LaFazenda** — SAP-to-HubSpot CRM sync middleware + CRM Card UI.

## Project layout

The actual project root is nested one level deeper:

```
F:\Cebra\fazenda\opencode\
  plan.md                        ← New feature plan (Web Extension)
  lafazenda-sync-project-main\
    lafazenda-sync-project-main\ ← REAL PROJECT ROOT
      src/                       ← NestJS backend
      client/                    ← Quasar/Vue3 frontend (separate package.json)
      test/                      ← E2E tests
      aws_project/               ← Alternative AWS Lambda/SQS sync (Python)
```

## Commands

**Backend** (run from `lafazenda-sync-project-main/lafazenda-sync-project-main/`):

| Command | Purpose |
|---|---|
| `npm run start:dev` | Dev with hot reload |
| `npm run build` | Compile TS → `dist/` |
| `npm run lint` | ESLint `src/**/*.ts` (with --fix) |
| `npm run format` | Prettier on src/ and test/ |
| `npm run test` | Jest unit tests |
| `npm run test:e2e` | E2E tests (uses `test/jest-e2e.json`) |

**Frontend** (run from `client/`):

| Command | Purpose |
|---|---|
| `npm run dev` | Quasar dev server with HMR |
| `npm run build` | Production build → `client/dist/spa/` |
| `npm run lint` | ESLint on .js/.vue |

There is no root-level dev command. Backend and frontend are developed independently.

## Architecture

### Backend (NestJS 10, TS, CommonJS modules)

**Entry:** `src/main.ts` → `AppModule`
**Global prefix:** `/api/v1/`
**Swagger:** `/api/v1/swagger` (dev/staging only)
**Bull Board:** `/api/v1/queues`

Modules registered in `app.module.ts`:
- `UtilsModule` — LoggerService, global config (`CONFIG` object)
- `HubspotModule` — CRM sync: cron jobs poll SAP tables → enqueue to BullMQ → process into HubSpot
- `SapModule` — Reads raw SAP data from `FAZENDA` MySQL (read-only)
- `SdkModule` — HubSpot CRM Card / OAuth flow (`/api/v1/sdk`)
- `AuthModule` — JWT auth (`/api/v1/auth`)

**Two MySQL connections:**
1. **Default** (`synchronize: true`) — HubSpot sync entities + queue tracking tables
2. **Named `FAZENDA`** (`synchronize: false`, read-only) — SAP source data (`SAP_HUBSPOT_BPS`, `SAP_HUBSPOT_REPORTE_VENTAS`)

### HubSpot sync flow

```
SAP MySQL → SapService (cron @1min) → Temp tables → HubspotService → BullMQ queues → Processors → HubSpot API
```

- Queue names: `EMPRESA_PRIMARIA`, `EMPRESA_SECUNDARIA`, `NEGOCIO` (deals currently disabled)
- Redis required for BullMQ
- HubSpot API calls use `INTEGRATIONS.hubspot.apiV3` (`https://api.hubapi.com/crm/v3`)

### Frontend (Quasar v2, Vue 3, Vite)

- CRM Card UI shown inside HubSpot iframes
- Reads `.env` from the **parent directory** (`client/quasar.config.js` line: `path: join(__dirname, '..', '.env')`)
- No tests configured

## Environment variables

`HUBSPOT_TOKEN` is the main API key (maps to `CONFIG.integrations.hubspot.apiKey`).

Two separate sets of HubSpot credentials exist:
- `HUBSPOT_TOKEN` / `HUBSPOT_CLIENT_SECRET` — general API
- `HUBSPOT_APP_*` (ID, APIKEY, CLIENT_ID, REDIRECT_URI, CLIENT_SECRET) — SDK/OAuth app

**Gotcha:** The config has a typo fallback: `process.env.PROYECT_NAME || process.env.PROJECT_NAME`. Use `PROJECT_NAME`.

**FAZENDA DB env vars** are prefixed with `F`: `FMYSQL_HOSTNAME`, `FMYSQL_PORT`, `FMYSQL_USER`, `FMYSQL_PASSWORD`, `FMYSQL_DATABASE`. These are required for the SAP module.

## Code conventions

- Semicolons required, single quotes (see `.eslintrc.js`, `.prettierrc`)
- NestJS CLI is configured with `"spec": false` — `nest generate` will NOT create `.spec.ts` files
- NestJS resources: use `@Injectable()` DI, TypeORM entities in `models/` subdirectories per module
- When adding a new module, register it in `src/app.module.ts` imports array

## Web Extension feature (plan.md)

Active plan to add a Chrome/Edge extension. Implementation involves:

1. **New backend module:** `src/web-extension/` with endpoints:
   - `GET /api/v1/web-extension/companies/all` — bulk fetch for cache seeding
   - `GET /api/v1/web-extension/companies/search?q=` — search by name/cod_cliente
   - Register `WebExtensionModule` in `app.module.ts`

2. **New extension directory:** `web-extension/` at workspace root (sibling to the NestJS project)
   - Manifest V3, content script + popup
   - Client-side fuzzy search with `chrome.storage.local` cache (24h TTL)
   - Background sync every 6h via `chrome.alarms`
   - Content script injects `cod_cliente` into HubSpot report filter inputs using `MutationObserver` + native input value setter + React event dispatch

3. **Selector for DOM injection:** `[data-test-id="fr-operator-ContainAny-input"] .Select-multi-value-wrapper input`

## Infrastructure

- Docker: uses external network `sdk_lafazenda_project_v2_lafazenda_net` (Redis/MySQL expected on that network, not defined in compose)
- CI: Jenkinsfile pulls from `git@github.com:CebraLab/template-nest-project.git` (`main` branch)
- Build: multi-stage Docker (node:20-alpine), exposes `${PORT}` (default 3000)
- JWT secret via `JWT_SECRET` / `JWT_EXTERNAL_SECRET` env vars (fallback: `change-me-in-production`)

## Project memory

El archivo `MEMORY.md` actúa como memoria del proyecto. Debe actualizarse automáticamente después de cada cambio significativo (nuevo archivo, refactor, instalación de dependencias, decisión de diseño, bug resuelto) sin que el usuario lo solicite.

Reglas:
- Actualizar tras cada acción significativa, no solo al final de la sesión.
- No duplicar información — si algo ya está registrado, modificar la entrada existente.
- Mantener formato Markdown limpio y consistente.
- Ser conciso pero accionable para futuras sesiones.
- Colocar la razón detrás de cada cambio, no solo el cambio en sí.
