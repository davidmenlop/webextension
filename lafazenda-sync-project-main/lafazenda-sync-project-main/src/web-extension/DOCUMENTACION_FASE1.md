# Documentacion Fase 1 — WebExtension Backend

> **Fecha de validacion:** 2026-05-22
> **Estado:** Completada y probada

## Resumen

La Fase 1 implementa el modulo backend `WebExtensionModule` en NestJS que expone 3 endpoints REST
para que la extension de Chrome/Edge pueda buscar empresas de HubSpot CRM. El modulo actua como proxy:
la extension llama al backend, y el backend reenvia las peticiones a la API de HubSpot CRM v3.

---

## Arquitectura

```
┌──────────────────────────┐     ┌──────────────────────────────┐     ┌──────────────────┐
│ Chrome/Edge Extension    │────▶│ NestJS Backend                │────▶│ HubSpot CRM API  │
│                          │     │ /api/v1/web-extension/*       │     │ /crm/v3/objects/ │
│ popup.js (cache local)   │     │                              │     │   companies      │
│ content.js (DOM)         │     │ WebExtensionController        │     │   companies/...  │
└──────────────────────────┘     │   └─ WebExtensionService      │     │                  │
                                 │       └─ INTEGRATIONS.hubspot │     │                  │
                                 │          .apiV3 (Axios)       │     │                  │
                                 └──────────────────────────────┘     └──────────────────┘
```

---

## Archivos creados

| Archivo | Proposito |
|---|---|
| `src/web-extension/web-extension.module.ts` | Declara el modulo, importa `UtilsModule` |
| `src/web-extension/web-extension.controller.ts` | Endpoints REST con validacion de params |
| `src/web-extension/web-extension.service.ts` | Logica de negocio: llamadas a HubSpot CRM API |
| `src/web-extension/web-extension.service.spec.ts` | Tests unitarios del service (16 tests) |
| `src/web-extension/web-extension.controller.spec.ts` | Tests unitarios del controller (8 tests) |
| `src/web-extension/API.md` | Documentacion de endpoints (existente) |
| `src/web-extension/DOCUMENTACION_FASE1.md` | Este archivo |

### Archivo modificado

| Archivo | Cambio |
|---|---|
| `src/app.module.ts:15` | Agregado `import { WebExtensionModule }` |
| `src/app.module.ts:64` | Agregado `WebExtensionModule` al array `imports` |

---

## Endpoints

### 1. `GET /api/v1/web-extension/companies`

Lista empresas con paginacion. Proxy de `GET /crm/v3/objects/companies`.

| Param | Tipo | Default | Descripcion |
|---|---|---|---|
| `limit` | number | 100 | Cantidad de resultados por pagina |
| `after` | string | — | Cursor de paginacion para la siguiente pagina |

**Validaciones:**
- Si `limit` no es un numero valido (`NaN`), se usa el default 100

**Respuesta (200):**
```json
{
  "results": [
    { "id": "123456789", "name": "ACME Corp", "cod_cliente": "C001" }
  ],
  "paging": {
    "next": { "after": "50" }
  }
}
```

### 2. `GET /api/v1/web-extension/companies/all`

Obtiene TODAS las empresas iterando todas las paginas. Usado para sembrar el cache local
de la extension.

**Sin parametros.**

**Respuesta (200):**
```json
{
  "companies": [
    { "id": "123", "name": "ACME Corp", "cod_cliente": "C001" }
  ],
  "total": 2450,
  "syncedAt": "2026-05-22T19:45:00.000Z"
}
```

### 3. `GET /api/v1/web-extension/companies/search`

Busca empresas por nombre o `cod_cliente` con logica OR.
Proxy de `POST /crm/v3/objects/companies/search`.

| Param | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `q` | string | Si | Termino de busqueda |

**Request a HubSpot:**
```json
{
  "filterGroups": [
    { "filters": [{ "propertyName": "name", "operator": "CONTAINS_TOKEN", "value": "<q>" }] },
    { "filters": [{ "propertyName": "cod_cliente", "operator": "CONTAINS_TOKEN", "value": "<q>" }] }
  ],
  "properties": ["name", "cod_cliente"],
  "limit": 50
}
```

**Validaciones:**
- `q` ausente, vacio, o solo whitespace → `400 Bad Request`

**Respuesta (200):**
```json
{
  "results": [
    { "id": "123456789", "name": "Empresa XYZ", "cod_cliente": "C00145" }
  ]
}
```

---

## Formato de datos (`CompanyResult`)

```typescript
interface CompanyResult {
  id: string;           // ID interno de HubSpot
  name: string;         // Nombre de la empresa (nunca null, minimo "")
  cod_cliente: string | null;  // Codigo de cliente SAP (null si no asignado)
}
```

---

## Resultados de validacion

### Tests unitarios: 24/24 ✅

| Suite | Tests | Resultado |
|---|---|---|
| `WebExtensionService` | 16 | PASS |
| `WebExtensionController` | 8 | PASS |
| **Total** | **24** | **PASS** |

**Cobertura de casos del service:**
- `getCompanies()`: default params, custom limit+after, empty results, missing properties, paging
- `getAllCompanies()`: multi-page, single page, zero companies
- `searchCompanies()`: OR logic, no matches, search by cod_cliente

**Cobertura de casos del controller:**
- `GET /companies`: default params, custom limit, after cursor, NaN limit, undefined params
- `GET /companies/all`: with results, empty list
- `GET /companies/search`: by name, whitespace trim, empty q (400), whitespace-only q (400), undefined q (400), by cod_cliente

### Build TypeScript: ✅

Compilacion limpia sin errores. `nest build` exitoso.

### Lint (ESLint): ✅

Sin errores ni warnings en `src/web-extension/**/*.ts`.

---

## Bugs corregidos durante la Fase 1

| Bug | Archivo | Solucion |
|---|---|---|
| **TS4053** — Interfaces no exportadas | `web-extension.service.ts:6,12,18` | Agregado `export` a `CompanyResult`, `AllCompaniesResponse`, `PaginatedResponse` |
| **NaN en parseInt** | `web-extension.controller.ts:14` | Validacion con `isNaN()` antes de pasar al service |
| **Falta `@bull-board/express`** | `package.json` | Instalado `@bull-board/express@5.21.1` (requerido por `app.module.ts`) |

---

## Dependencias

El modulo reutiliza infraestructura existente:
- **`INTEGRATIONS.hubspot.apiV3`** — Axios instance pre-configurada con `Authorization: Bearer ${HUBSPOT_TOKEN}` y baseURL `https://api.hubapi.com/crm/v3`
- **`LoggerService`** — Winston logger del proyecto, via `UtilsModule`

No se agregaron nuevas dependencias a `package.json` especificamente para este modulo.

---

## Registro en AppModule

```typescript
// src/app.module.ts
import { WebExtensionModule } from './web-extension/web-extension.module';

@Module({
  imports: [
    // ... otros modulos
    WebExtensionModule  // linea 64
  ]
})
export class AppModule {}
```

El modulo esta registrado en el array `imports` del `AppModule`, lo que lo hace accesible
bajo el prefix global `/api/v1/`.

---

## Siguientes fases

| Fase | Descripcion |
|---|---|
| **Fase 2** | Crear estructura de archivos de la extension (`web-extension/`) |
| **Fase 3** | `manifest.json` + iconos |
| **Fase 4** | `lib/fuzzy-search.js` — Algoritmo de busqueda difusa client-side |
| **Fase 5** | `lib/cache.js` — Gestion de cache en `chrome.storage.local` con TTL |
| **Fase 6** | Popup UI (HTML + CSS + JS con busqueda fuzzy y cache) |
| **Fase 7** | Content script con MutationObserver |
| **Fase 8** | `config.js` y `background.js` con alarm de re-sincronizacion |
