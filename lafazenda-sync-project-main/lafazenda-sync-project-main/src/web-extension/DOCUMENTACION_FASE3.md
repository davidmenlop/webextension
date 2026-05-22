# Documentacion Fase 3 — Pruebas de integracion

> **Fecha de validacion:** 2026-05-22
> **Estado:** Validacion estatica completada | Pendiente: carga en Chrome/Edge con backend real

## Resumen

La Fase 3 consiste en cargar la extension como unpacked en Chrome/Edge y verificar el flujo end-to-end:
1. Apertura del popup → verificacion de cache → sincronizacion con backend
2. Busqueda fuzzy client-side con datos cacheados
3. Seleccion de empresa → envio de mensaje al content script
4. Content script → inyeccion de `cod_cliente` en filtro de HubSpot Reports
5. Background → alarm de re-sincronizacion cada 6 horas

---

## Validacion estatica completada

Antes de la carga en el navegador, se realizo una revision exhaustiva de todos los archivos del frontend (extension) para detectar bugs de runtime.

### Bugs detectados y corregidos

| # | Bug | Archivo | Linea | Gravedad | Sintoma | Solucion |
|---|---|---|---|---|---|---|
| 1 | URL sin prefijo `/api/v1/` | `lib/cache.js` | 41 | **Critico** | `syncCache()` llamaba a `/web-extension/companies/all` → 404. Mismo bug que Fase 2 #2 (background.js) pero en el archivo de cache | Agregado `/api/v1/` al path |
| 2 | `syncCache()` no retornaba `companies` | `lib/cache.js` | 45 | **Critico** | `popup.js` usaba el valor de retorno como array. Retornaba `{ success: true, total: N }` sin el array de companies → `TypeError: syncResult.companies is undefined` | Agregado `companies: data.companies` al return |
| 3 | `getCache()` no retornaba `syncedAt` | `lib/cache.js` | 14, 17 | **Alto** | `formatCacheAge(cache)` en `popup.js` espera `cache.syncedAt` pero `getCache()` solo retornaba `{ valid, companies, total }`. Cache age siempre vacio | Agregado `syncedAt: cacheData.syncedAt` al return de `getCache()` |
| 4 | `isCacheFresh` no definida | `popup/popup.js` | 59 | **Critico** | `ReferenceError: isCacheFresh is not defined`. La funcion en `cache.js` se llama `isCacheValid()` y toma el raw storage data, no el objeto normalizado | Reemplazado por `cache.valid` (el campo que `getCache()` ya calcula internamente) |
| 5 | `syncCache()` resultado tratado como array | `popup/popup.js` | 67-71 | **Critico** | `companies = await syncCache(); companies.slice(...)` fallaba porque `syncCache()` retorna `{ success, ... }` no un array | Corregido: `const syncResult = await syncCache(); companies = syncResult.companies` |

### Bugs pre-existentes no detectados en Fase 2

| # | Bug | Origen | Explicacion |
|---|---|---|---|
| 1 | URL `/api/v1/` faltante en `cache.js` | Bug #2 de Fase 2 se corrigio solo en `background.js`, se omitio `cache.js` | `background.js` y `cache.js` comparten la misma logica de fetch pero no comparten codigo. Ambos archivos deben tener la URL con prefijo. |
| 3 | `getCache()` sin `syncedAt` | Diseno original de `getCache()` no exponia metadata | `formatCacheAge()` en `popup.js` depende de `syncedAt` pero `getCache()` no lo exponia en su interfaz de retorno. |
| 4 | `isCacheFresh` vs `isCacheValid` | Confusion de nombres entre archivos | `cache.js` define `isCacheValid(rawData)` (verifica raw storage). `popup.js` intentaba usar `isCacheFresh(normalizedObject)` que no existe en ningun archivo. El campo `valid` de `getCache()` es el correcto. |

### Validacion de dependencias de scripts

| Componente | Orden de carga | Estado |
|---|---|---|
| **Popup** | `config.js` → `fuzzy-search.js` → `cache.js` → `popup.js` | OK |
| **Content script** | `config.js` → `content.js` (via manifest.json `content_scripts.js`) | OK |
| **Background** | `importScripts('../config.js')` al inicio de `background.js` | OK |

---

## Resultados de validacion

### Backend: Tests unitarios — 24/24

| Suite | Tests | Resultado |
|---|---|---|
| `WebExtensionService` | 16 | PASS |
| `WebExtensionController` | 8 | PASS |
| **Total** | **24** | **PASS** |

### Backend: Build TypeScript

Compilacion limpia (`nest build`) sin errores.

### Backend: Lint (ESLint web-extension module)

Sin errores ni warnings en `src/web-extension/**/*.ts`.

### Frontend: Analisis estatico de archivos

| Archivo | Lineas | Sin errores de sintaxis | Vars globales OK | Dependencias OK |
|---|---|---|---|---|
| `manifest.json` | 29 | Valid JSON | N/A | OK |
| `config.js` | 7 | Sin errores | `CONFIG` global | OK |
| `lib/fuzzy-search.js` | 95 | Sin errores | `normalize`, `levenshtein`, `fuzzySearch` | OK (autocontenido) |
| `lib/cache.js` | 50 | Sin errores | `getCache`, `setCache`, `syncCache`, `isCacheValid` | Usa `CONFIG`, `chrome.storage` |
| `popup/popup.html` | 27 | Valid HTML5 | N/A | OK (script order correcto) |
| `popup/popup.css` | 136 | Valid CSS3 | N/A | OK (autocontenido) |
| `popup/popup.js` | 115 | Sin errores | Usa `CONFIG`, `fuzzySearch`, `getCache`, `syncCache` | OK |
| `content/content.js` | 27 | Sin errores | Usa `chrome.runtime.onMessage`, `CONFIG.SEARCH_INPUT_SELECTOR` | OK |
| `background/background.js` | 34 | Sin errores | `importScripts('config.js')`, usa `CONFIG.BACKEND_URL`, `chrome.alarms`, `chrome.storage` | OK |
| **TOTAL** | **12 archivos** | **Todos OK** | | |

### Propiedades del manifest

| Propiedad | Valor | Estado |
|---|---|---|
| `manifest_version` | 3 | OK |
| `permissions` | `activeTab`, `scripting`, `storage`, `alarms` | OK |
| `host_permissions` | `*://app.hubspot.com/*`, `https://<BACKEND_URL>/*` | Pendiente: configurar URL real |
| `action.default_popup` | `popup/popup.html` | OK |
| `content_scripts[0].js` | `["config.js", "content/content.js"]` | OK |
| `content_scripts[0].matches` | `*://app.hubspot.com/reports/*` | OK |
| `content_scripts[0].run_at` | `document_idle` | OK |
| `background.service_worker` | `background/background.js` | OK |

---

## Instrucciones para carga en Chrome/Edge

### Prerequisitos

1. **Backend NestJS corriendo** con `WebExtensionModule` registrado (ya esta en `app.module.ts`)
2. **URL del backend configurada** en dos archivos:
   - `web-extension/config.js` linea 2: `BACKEND_URL: 'https://<URL_REAL>'`
   - `web-extension/manifest.json` linea 9: `"https://<URL_REAL>/*"`
3. **Variables de entorno** del backend configuradas (`HUBSPOT_TOKEN`, `FMYSQL_*`, etc.)

### Pasos para cargar en Chrome

1. Abrir `chrome://extensions/`
2. Activar **Modo desarrollador** (toggle arriba a la derecha)
3. Click en **Cargar descomprimida**
4. Seleccionar el directorio `web-extension/` (el que contiene `manifest.json`)
5. La extension aparece como "HubSpot Company Search"
6. Anotar el **Extension ID** para debug

### Pasos para cargar en Edge

1. Abrir `edge://extensions/`
2. Activar **Modo desarrollador** (toggle abajo a la izquierda)
3. Click en **Cargar descomprimida**
4. Seleccionar el directorio `web-extension/`
5. La extension aparece como "HubSpot Company Search"

---

## Casos de prueba manuales (checklist)

### CP-01: Cache seeding inicial

| Paso | Accion | Resultado esperado |
|---|---|---|
| 1 | Instalar extension por primera vez | Background sync se ejecuta automaticamente (`onInstalled`) |
| 2 | Abrir popup en cualquier pagina | Status: "Sincronizando con HubSpot..." → luego lista de empresas |
| 3 | Verificar `chrome.storage.local` en DevTools | `companyCache` existe con `companies`, `total`, `syncedAt` |
| 4 | Cerrar y reabrir popup | Status: "Cache: hace X min" (sin re-sincronizar) |

### CP-02: Busqueda fuzzy

| Paso | Accion | Resultado esperado |
|---|---|---|
| 1 | Escribir "distri" en el input | Empresas con "distribuidora" o similar aparecen |
| 2 | Escribir un cod_cliente parcial | Empresa correspondiente aparece |
| 3 | Escribir con typo (ej: "distrivuidora") | Resultados fuzzy con tolerancia de 2 caracteres |
| 4 | Escribir texto sin coincidencias | "Sin resultados" |
| 5 | Borrar el texto | Vuelve a mostrar lista completa (top 20) |

### CP-03: Inyeccion en HubSpot Reports (Flujo E2E completo)

| Paso | Accion | Resultado esperado |
|---|---|---|
| 1 | Abrir `app.hubspot.com/reports/*` en una pestana | Content script cargado (`document_idle`) |
| 2 | Abrir popup de la extension | Lista de empresas cargada |
| 3 | Buscar empresa con `cod_cliente` conocido | Resultado mostrado |
| 4 | Hacer clic en el item | Popup se cierra, input de filtro en HubSpot Reports se llena con el `cod_cliente` y el filtro se aplica |

### CP-04: Background sync alarm

| Paso | Accion | Resultado esperado |
|---|---|---|
| 1 | Verificar `chrome.alarms` en DevTools de Service Worker | Alarma `syncCache` existe con `periodInMinutes: 360` |
| 2 | (Opcional) Forzar `chrome.alarms.create('syncCache', { delayInMinutes: 0.1 })` desde consola | Cache se refresca en ~6 segundos |
| 3 | Verificar `companyCache.syncedAt` en storage | Timestamp actualizado |

### CP-05: Manejo de errores

| Paso | Accion | Resultado esperado |
|---|---|---|
| 1 | Detener el backend NestJS | |
| 2 | Abrir popup | Status: "Error al sincronizar. Intente de nuevo." |
| 3 | Re-iniciar backend y reabrir popup | Sincronizacion exitosa, lista cargada |
| 4 | Abrir popup en pagina que no es HubSpot Reports | Lista funciona normalmente |
| 5 | Hacer clic en empresa en pagina no-Reports | Console log: "[Popup] Content script not ready on this page..." |

---

## Archivos modificados en Fase 3

| Archivo | Cambio | Linea(s) |
|---|---|---|
| `web-extension/lib/cache.js` | URL corregida: `/web-extension/companies/all` → `/api/v1/web-extension/companies/all` | 41 |
| `web-extension/lib/cache.js` | `syncCache()` ahora retorna `{ success, companies, total }` (antes sin `companies`) | 45 |
| `web-extension/lib/cache.js` | `getCache()` ahora retorna `syncedAt` en ambos caminos (valid y expired) | 14, 17 |
| `web-extension/popup/popup.js` | `isCacheFresh(cache)` → `cache.valid` (funcion inexistente) | 59-60 |
| `web-extension/popup/popup.js` | `syncCache()` resultado tratado como objeto, no como array | 66-69 |
| `web-extension/popup/popup.js` | Agregado check `cache.companies.length > 0` para cache vacio | 60 |

---

## Configuracion pendiente (para el usuario)

| Item | Archivo | Valor actual | Accion requerida |
|---|---|---|---|
| URL del backend | `config.js:2` | `'https://<URL_DEL_BACKEND>'` | Reemplazar con la URL real del backend NestJS |
| URL del backend | `manifest.json:9` | `'https://<BACKEND_URL>/*'` | Reemplazar con la URL real del backend NestJS |

---

## Resumen de estado por fase

| Fase | Descripcion | Estado |
|---|---|---|
| Fase 1 | Backend WebExtensionModule (3 endpoints, 24 tests) | Completada |
| Fase 2 | Extension frontend (12 archivos, bugs #1-#4 corregidos) | Completada |
| Fase 3 | Pruebas estaticas: 5 bugs corregidos. Pendiente: carga en navegador con backend real | Validacion estatica completada |
