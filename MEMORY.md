# MEMORY.md — Memoria del proyecto

> Este archivo se actualiza automáticamente. Cada cambio significativo se registra aquí sin que el usuario lo solicite.
> NO editar manualmente — las sesiones de OpenCode lo mantienen sincronizado.

## Arquitectura

- Proyecto monorepo con dos subpaquetes independientes: backend NestJS y frontend Quasar/Vue3.
- Raíz real del proyecto: `lafazenda-sync-project-main/lafazenda-sync-project-main/`
- Backend: NestJS 10 con CommonJS modules, global prefix `/api/v1/`
- Frontend: Quasar v2 + Vue 3 + Vite, compilado a `client/dist/spa/`
- AWS Project (`aws_project/`): implementación alternativa del sync SAP→HubSpot vía AWS Lambda + SQS en Python (no activa actualmente).

**Módulos del backend:**

| Módulo | Propósito |
|---|---|
| `UtilsModule` | LoggerService, configuración global (`CONFIG`) |
| `HubspotModule` | Sync CRM: cron jobs → BullMQ → HubSpot API |
| `SapModule` | Lectura de SAP desde MySQL `FAZENDA` (read-only) |
| `SdkModule` | CRM Card / OAuth flow (`/api/v1/sdk`) |
| `AuthModule` | JWT auth (`/api/v1/auth`) |
| `WebExtensionModule` | Endpoints para la extensión Chrome/Edge (`/api/v1/web-extension`) |

**Flujo de sync HubSpot:**
```
SAP MySQL → SapService (cron @1min) → Temp tables → HubspotService → BullMQ queues → Processors → HubSpot API
```

**Dos conexiones MySQL:**
1. Default (`synchronize: true`): entidades de sync HubSpot y tablas de queue tracking
2. FAZENDA (`synchronize: false`, read-only): tablas SAP (`SAP_HUBSPOT_BPS`, `SAP_HUBSPOT_REPORTE_VENTAS`)

**Colas BullMQ:** `EMPRESA_PRIMARIA`, `EMPRESA_SECUNDARIA`, `NEGOCIO` (deals disabled)

## Stack técnico

- **Backend:** NestJS 10, TypeScript 5.1 (target ES2021, CommonJS), TypeORM 0.3.20, BullMQ 5.x, Redis, Winston, Axios
- **Frontend:** Quasar v2, Vue 3, Vue Router 4, Pinia, Vite, Axios
- **Database:** MySQL (dos conexiones: `cebra_integration` + `FAZENDA`)
- **Queue:** BullMQ sobre Redis
- **External API:** HubSpot CRM v3/v4 (axios instances pre-configurados en `integrations.config.ts`)
- **Container:** Docker multi-stage (node:20-alpine)
- **CI/CD:** Jenkins
- **AWS (alternativo):** Lambda + SQS en Python 3.11

## Configuración y entorno

**Variables de entorno críticas:**

| Variable | Propósito |
|---|---|
| `HUBSPOT_TOKEN` | API key principal para todas las llamadas a HubSpot |
| `HUBSPOT_CLIENT_SECRET` | OAuth client secret general |
| `HUBSPOT_APP_*` | Credenciales de la app SDK/OAuth (ID, APIKEY, CLIENT_ID, REDIRECT_URI, CLIENT_SECRET) |
| `MYSQL_*` | Conexión MySQL default (sync entities) |
| `FMYSQL_*` | Conexión MySQL FAZENDA (SAP, read-only) |
| `REDIS_*` | Conexión Redis para BullMQ |
| `PROJECT_NAME` | Nombre del proyecto (⚠️ typo fallback: `PROYECT_NAME`) |
| `NODE_ENV` | `development` / `production` / `staging` |
| `CORS_ORIGINS` | Orígenes CORS permitidos (default `*`) |

**Servicios requeridos:**
- MySQL (dos instancias/bases de datos)
- Redis (para BullMQ)
- Red Docker externa: `sdk_lafazenda_project_v2_lafazenda_net`

**Gotchas:**
- JWT secret via `JWT_SECRET` / `JWT_EXTERNAL_SECRET` env vars
- `nest-cli.json` tiene `"spec": false` → `nest generate` no crea `.spec.ts`
- Frontend lee `.env` del directorio padre (`client/quasar.config.js` → `join(__dirname, '..', '.env')`)
- Docker compose no define Redis ni MySQL, espera que estén en la red externa

## Decisiones de diseño

1. **Web Extension UI como popup (no inline)** — Se eligió popup (ventana emergente) en lugar de inyectar el buscador directamente en la página de dashboards. Esto evita conflictos con actualizaciones del DOM de HubSpot y simplifica el desarrollo. El content script solo hace la inyección del valor en el input de filtro.
2. **Proxy vía backend NestJS (no API directa de HubSpot)** — La extensión llama al backend existente en lugar de tener un token de HubSpot Private App embebido. Motivo: mantener el token en el servidor (más seguro) y reutilizar la configuración de axios existente.
3. **Búsqueda fuzzy client-side con caché en `chrome.storage.local`** — El endpoint `/all` siembra el diccionario completo de empresas (nombre → cod_cliente) en caché del navegador (TTL 24h, background sync cada 6h). La búsqueda se hace localmente con distancia de Levenshtein (tolerancia 2 caracteres) para absorver typos, eliminando latencia de red y llamadas repetitivas a HubSpot.
4. **Inyección DOM con MutationObserver + nativeInputValueSetter + eventos React** — Para setear el valor en el input de filtro de HubSpot Reports se usa el setter nativo del prototipo de `HTMLInputElement` (bypassea React) más eventos `input` y `keydown Enter` para activar el filtro. Selector: `[data-test-id="fr-operator-ContainAny-input"] .Select-multi-value-wrapper input`.

## Bugs conocidos y soluciones

- **TS4053 en web-extension.controller.ts**: Las interfaces `CompanyResult`, `AllCompaniesResponse`, `PaginatedResponse` en el service no estaban exportadas. Solución: agregar `export` a las 3 interfaces.
- **Falta `@bull-board/express` en dependencias**: El build fallaba con `TS2307` en `app.module.ts:10`. Se instaló `@bull-board/express@5.21.1` (misma versión que el resto de bull-board packages).
- **`npm run lint` no funciona en Windows**: El glob `{src,apps,libs,test}` (brace expansion) no se expande en PowerShell/cmd.exe. Workaround: usar `npx eslint "src/**/*.ts"`.
- **NaN en `parseInt` del controller**: `parseInt( 'abc', 10 )` retornaba `NaN` sin validación. Solución: validar con `isNaN()` en `web-extension.controller.ts:14`. Fix validado en test `should handle invalid limit (NaN)`.
- **Fase 2 Bug #1**: `CONFIG` undefined en background service worker → agregado `importScripts('../config.js')`.
- **Fase 2 Bug #2**: URL sin `/api/v1/` en `background.js` → corregido. **Reaparecio en Fase 3**: mismo bug en `cache.js` (no compartian codigo).
- **Fase 3 Bug #1**: `syncCache()` no retornaba `companies` → `popup.js` no podia renderizar resultados.
- **Fase 3 Bug #2**: `getCache()` no retornaba `syncedAt` → `formatCacheAge()` siempre mostraba string vacio.
- **Fase 3 Bug #3**: `isCacheFresh()` no definida en `popup.js` → `ReferenceError`. La funcion real es `isCacheValid()` en `cache.js`, pero `getCache()` ya expone `.valid`.
- **Fase 3 Bug #4**: `syncCache()` retorna objeto, tratado como array en `popup.js` → `TypeError: syncResult.companies.slice is not a function`.
- **Fase 4 Bug #1**: `init()` mostraba lista vacia al abrir popup (3 ocurrencias de `showResults(); resultsList.innerHTML = ''` en vez de `renderResults(companies.slice(0, 20))`). El plan requiere top 20 resultados iniciales.
- **Fase 4 Bug #2**: `syncCache()` y `syncCompanyCache()` usaban `fetch()` sin timeout → popup/service worker colgados si backend inalcanzable. Solucion: `AbortController` con 30s timeout + `clearTimeout` en ambos caminos (exito/error).
- **Fase 4 Bug #3**: Codigo duplicado entre handler de `click` y `Enter` para enviar `cod_cliente` al content script. Solucion: extraida funcion `sendCodCliente()` unificada, eliminada `selectCompany()` redundante.
- **Fase 4 Bug #4**: Variables `term` e `idx` no usadas en `renderResults()` (dead code). Eliminadas. `popup.js` reducido de 192 a 178 lineas.
- **Fase 4 Bug #5**: CSS `.item-name .highlight` definida pero nunca aplicada en JS (highlight de terminos no implementado).
- **Fase 4 Bug #6**: `activeTab` y `scripting` en `manifest.json:6` son innecesarios (no usados por la extension). **Corregido en Fase 5.**
- **Fase 5 Bug #1**: Popup vacio al limpiar input de busqueda. El handler de `input` ocultaba resultados en vez de restaurar top 20. Solucion: `renderResults(companies.slice(0, CONFIG.MAX_RESULTS))` cuando `term` vacio. (`popup.js:130-152`)
- **Fase 5 Bug #2**: Duplicacion de logica `syncCache()` y `syncCompanyCache()` en `cache.js` y `background.js`. Solucion: `background.js` importa `cache.js` y reutiliza `syncCache()`. Background reducido de 40 a 24 lineas.
- **Fase 5 Bug #3**: MutationObserver sin timeout en content script. Si el selector nunca aparece, observer queda activo para siempre. Solucion: `setTimeout` 15s con flag `resolved`. (`content.js:19-26`)
- **Fase 5 Bug #4**: Permisos innecesarios `activeTab`/`scripting` corregidos. Reducido a `["storage", "alarms"]`.
- **Fase 5 Mejora #1**: Implementada `highlightText()` en `popup.js:62-72`. Resalta terminos coincidentes en nombre y cod_cliente usando CSS `.highlight`. Soporta coincidencias parciales con normalizacion Unicode.
- **Fase 5 Mejora #2**: Agregado debounce 150ms al input listener (`popup.js:128-152`). `DEBOUNCE_MS` configurable en `config.js:7`.
- **Fase 5 Mejora #3**: Agregado `content_security_policy` al manifest (`manifest.json:29-31`) para compatibilidad con Chrome Web Store.

## Historial de cambios

| Fecha | Cambio | Archivos afectados |
|---|---|---|
| 2026-05-20 | Plan de Web Extension creado y refinado con caché local + fuzzy search | `plan.md` |
| 2026-05-20 | AGENTS.md creado con guía del proyecto | `AGENTS.md` |
| 2026-05-20 | MEMORY.md inicializado (este archivo) | `MEMORY.md` |
| 2026-05-20 | **Fase 1**: WebExtensionModule creado (module, controller, service con 3 endpoints) | `src/web-extension/*`, `src/app.module.ts` |
| 2026-05-20 | Fix: interfaces exportadas en service (TS4053) + instalación `@bull-board/express@5.21.1` | `src/web-extension/web-extension.service.ts`, `package.json` |
| 2026-05-20 | Tests unitarios para Fase 1 (24 tests: service + controller) | `src/web-extension/*.spec.ts` |
| 2026-05-20 | Fix: validación `isNaN()` en parseInt del controller | `src/web-extension/web-extension.controller.ts` |
| 2026-05-20 | Documentación de endpoints WebExtension (API.md) | `src/web-extension/API.md` |
| 2026-05-22 | **Validacion Fase 1**: 24/24 tests OK, build OK, lint OK. Documentacion completa (DOCUMENTACION_FASE1.md) | `src/web-extension/DOCUMENTACION_FASE1.md` |
| 2026-05-22 | **Fase 2**: Extension frontend completa (12 archivos) + 4 bugs corregidos (importScripts, URL prefix /api/v1, manifest content_scripts, archivos faltantes). Tests backend 24/24 OK. | `web-extension/lib/*`, `web-extension/popup/*`, `web-extension/content/*`, `web-extension/manifest.json`, `web-extension/background/background.js` |
| 2026-05-22 | **Fase 3**: Validacion estatica de integracion. 5 bugs criticos corregidos: (1) URL sin /api/v1 en cache.js, (2) syncCache() sin retornar companies, (3) getCache() sin syncedAt, (4) isCacheFresh no definida en popup.js, (5) syncCache() resultado tratado como array. Tests backend 24/24 OK, build OK, lint OK. | `web-extension/lib/cache.js`, `web-extension/popup/popup.js`, `src/web-extension/DOCUMENTACION_FASE3.md` |
| 2026-05-22 | **Fase 4**: Pruebas de runtime y validacion de errores. 6 bugs corregidos: (1) popup sin resultados iniciales — critico, (2) fetch sin timeout — medio, (3) codigo duplicado click/Enter — bajo, (4) dead code `term`/`idx` — bajo, (5) CSS highlight sin implementar — bajo, (6) permisos innecesarios `activeTab`/`scripting` — bajo. Refactor: extraida `sendCodCliente()`. Tests backend 24/24 OK, build OK, lint OK, sintaxis JS OK. | `web-extension/popup/popup.js`, `web-extension/lib/cache.js`, `web-extension/background/background.js`, `src/web-extension/DOCUMENTACION_FASE4.md` |
| 2026-05-22 | **Fase 5**: Pruebas finales y refinamiento. 4 bugs corregidos: (1) popup vacio al limpiar input — critico, (2) DRY syncCache duplicado — medio, (3) MutationObserver sin timeout — medio, (4) permisos innecesarios eliminados — bajo. 3 mejoras: highlightText, debounce 150ms, CSP en manifest. Background reducido 40→24 lineas. Tests backend 24/24 OK, build OK, lint OK, sintaxis JS OK. | `web-extension/popup/popup.js`, `web-extension/background/background.js`, `web-extension/content/content.js`, `web-extension/manifest.json`, `web-extension/config.js`, `src/web-extension/DOCUMENTACION_FASE5.md` |
| 2026-05-22 | **Repo**: Preparado para GitHub. Creado `.gitignore` raiz y `README.md`. Secretos eliminados del historial: HubSpot token en `process_message.py`, credenciales BD en `send_message.py`/`process_message.py`, JWT hardcodeado en `enviroment.config.ts` ahora usa `process.env`, contraseñas en `.env.example` reemplazadas por placeholders. Historial reescrito (single commit). Push exitoso a `github.com/davidmenlop/webextension`. | `.gitignore`, `README.md`, `aws_project/functions/*.py`, `.env.example`, `src/utils/config/enviroment.config.ts`, `AGENTS.md`, `MEMORY.md` |
