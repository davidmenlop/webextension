# Documentacion Fase 2 — WebExtension Frontend

> **Fecha de validacion:** 2026-05-22
> **Estado:** Completada y probada

## Resumen

La Fase 2 implementa todos los archivos del frontend de la extension Chrome/Edge (Manifest V3):
- Estructura de directorios completa
- Configuracion centralizada (`config.js`)
- Algoritmo de busqueda difusa client-side (`lib/fuzzy-search.js`)
- Gestion de cache en `chrome.storage.local` con TTL (`lib/cache.js`)
- UI del popup (HTML + CSS + JS) con busqueda fuzzy y cache local
- Content script con `MutationObserver` para inyeccion de `cod_cliente` en filtros de HubSpot
- Service worker con alarm de re-sincronizacion cada 6 horas
- Correccion de bugs detectados

---

## Estructura final de archivos

```
web-extension/
├── manifest.json              ✅ Manifest V3
├── config.js                  ✅ Configuracion centralizada
├── background/
│   └── background.js          ✅ Service worker con alarm de sync cada 6h
├── content/
│   └── content.js             ✅ MutationObserver + inyeccion DOM
├── icons/
│   ├── icon16.png             ✅
│   ├── icon48.png             ✅
│   └── icon128.png            ✅
├── lib/
│   ├── fuzzy-search.js        ✅ Algoritmo Levenshtein + priorizacion
│   └── cache.js               ✅ chrome.storage.local con TTL
└── popup/
    ├── popup.html             ✅ UI del popup
    ├── popup.css              ✅ Estilos (400x500px, HubSpot theme)
    └── popup.js               ✅ Logica de busqueda y seleccion
```

---

## Archivos creados

### 1. `lib/fuzzy-search.js` — Busqueda difusa client-side

Algoritmo de busqueda fuzzy con las siguientes caracteristicas:

| Funcion | Proposito |
|---|---|
| `normalize(str)` | Normaliza texto: lowercase + elimina tildes/diacriticos via Unicode NFD |
| `levenshtein(a, b)` | Calcula distancia de edicion entre dos strings (implementacion O(n*m) con arrays rotativos para eficiencia de memoria) |
| `startsWith(a, b)` | Verifica si `a` empieza con `b` (para priorizar coincidencias de prefijo) |
| `fuzzySearch(term, companies, options)` | Funcion principal de busqueda |

**Algoritmo de `fuzzySearch`:**
1. Normaliza el termino de busqueda (lowercase, sin tildes)
2. Tokeniza el termino en palabras individuales
3. Para cada empresa:
   - Normaliza `name` y `cod_cliente`
   - Compara cada token del termino contra cada token de cada campo
   - Calcula distancia de Levenshtein entre tokens
   - Tambien calcula distancia entre el termino completo y el valor completo
   - Marca `exactPrefix = true` si algun campo empieza exactamente con el termino
4. Filtra resultados con distancia <= tolerancia (default: 2)
5. Ordena: coincidencias de prefijo exacto primero, luego por menor distancia
6. Retorna top `maxResults` (default: 20)

**Opciones configurables (via `CONFIG` en `config.js`):**
- `FUZZY_TOLERANCE: 2` — Tolerancia maxima de distancia de Levenshtein
- `MAX_RESULTS: 20` — Cantidad maxima de resultados mostrados

### 2. `lib/cache.js` — Gestion de cache en `chrome.storage.local`

| Funcion | Proposito |
|---|---|
| `getCache()` | Lee el cache desde `chrome.storage.local` |
| `setCache(data)` | Escribe datos en `chrome.storage.local` con timestamp `Date.now()` |
| `isCacheFresh(cache, ttlHours)` | Verifica si el cache no ha expirado (default TTL: 24h desde `config.js`) |
| `getCompanies()` | Retorna empresas del cache si esta fresco, sino `null` |
| `syncCache()` | Llama `GET /api/v1/web-extension/companies/all`, guarda en cache y retorna empresas |

**Formato del cache:**
```json
{
  "companyCache": {
    "companies": [ ... ],
    "total": 2450,
    "syncedAt": 1716399900000
  }
}
```

### 3. `popup/popup.html` — UI del popup

Estructura HTML minimalista:
- `<input>` de busqueda con `autofocus`
- `<div id="status">` para estado de cache (edad, sincronizando, error)
- `<div id="results">` para lista de resultados
- Scripts cargados en orden: `config.js` → `fuzzy-search.js` → `cache.js` → `popup.js`

### 4. `popup/popup.css` — Estilos

- Tamanio: 400x500px
- Paleta de colores HubSpot (naranja `#ff7a59`, azul `#33475b`, grises `#cbd6e2`/`#eaf0f6`)
- Input de busqueda sticky en el top
- Items con hover state (`#e5f5f8`)
- `cod_cliente` mostrado como badge naranja (`[C00145]`)
- Scrollbar nativa en la lista de resultados
- Spinner CSS para estado de carga

### 5. `popup/popup.js` — Logica del popup

**Flujo:**
1. Al abrir, verifica cache via `getCache()`
2. Si cache fresco (< 24h): usa datos en memoria, muestra lista inicial
3. Si cache expirado/ausente: llama `syncCache()` → `GET /api/v1/web-extension/companies/all`
4. Muestra estado: "Cargando...", "Cache: hace X min", o "Error al sincronizar"
5. Al escribir en el input: `fuzzySearch(term, companies, {...})` → renderiza top 20 resultados
6. Al hacer clic en un item:
   - Envia mensaje al content script: `chrome.tabs.sendMessage(tabId, { action: 'fillCodCliente', value })`
   - Cierra el popup con `window.close()`
   - Si el content script no esta listo (pagina no es HubSpot reports), loggea advertencia
7. Tecla `Escape` cierra el popup

**Manejo de errores:**
- Si `syncCache()` falla: muestra mensaje de error y mantiene UI funcional
- Si `sendMessage` falla (pagina no compatible): catch silencioso con log

### 6. `content/content.js` — Content script

Inyecta `cod_cliente` en el input de filtro de HubSpot Reports usando:

1. **`MutationObserver`** — Espera a que el input este en el DOM (carga dinamica de React)
2. **`nativeInputValueSetter`** — Byppasea el control de React usando el setter nativo de `HTMLInputElement.prototype.value`
3. **`dispatchEvent('input')`** — Dispara el `onChange` de React para aplicar el filtro
4. **`dispatchEvent(KeyboardEvent Enter)`** — Confirma el filtro simulando presionar Enter

**Selector de inyeccion:** `[data-test-id="fr-operator-ContainAny-input"] .Select-multi-value-wrapper input`

El selector viene de `config.js` (`CONFIG.SEARCH_INPUT_SELECTOR`), que se carga antes gracias a `manifest.json:22` (`"js": ["config.js", "content/content.js"]`).

---

## Archivos corregidos

### `manifest.json` — Correccion de content_scripts

| Antes | Despues | Motivo |
|---|---|---|
| `"js": ["content/content.js"]` | `"js": ["config.js", "content/content.js"]` | `content.js` necesita la variable global `CONFIG` definida en `config.js` |

### `background/background.js` — 2 bugs corregidos

| Bug | Linea | Solucion |
|---|---|---|
| **`CONFIG` no definido** en service worker | 1 | Agregado `importScripts('../config.js')` al inicio |
| **URL sin prefijo `/api/v1/`** | 9 | Cambiado `/web-extension/companies/all` → `/api/v1/web-extension/companies/all` |

---

## Resultados de validacion

### Backend: Tests unitarios — 24/24 ✅

| Suite | Tests | Resultado |
|---|---|---|
| `WebExtensionService` | 16 | PASS |
| `WebExtensionController` | 8 | PASS |
| **Total** | **24** | **PASS** |

### Backend: Lint (ESLint) — ✅

Sin errores ni warnings en `src/web-extension/**/*.ts`.

### Backend: Build TypeScript — ✅

Compilacion limpia (`nest build`) sin errores.

### Frontend: Estructura de archivos — ✅

Todos los archivos del plan implementados (12 archivos en 6 directorios).

### Frontend: Dependencias de scripts — ✅

- `popup.html` carga scripts en orden: `config.js` → `fuzzy-search.js` → `cache.js` → `popup.js` ✅
- `manifest.json` carga `config.js` antes de `content.js` para content scripts ✅
- `background.js` importa `config.js` via `importScripts()` ✅

---

## Bugs detectados y corregidos en Fase 2

| # | Bug | Archivo | Gravedad | Solucion |
|---|---|---|---|---|
| 1 | `CONFIG` undefined en service worker | `background/background.js:1` | **Alta** — El service worker no tenia acceso a `CONFIG`, causando `ReferenceError` en `syncCompanyCache()` | Agregado `importScripts('../config.js')` |
| 2 | URL sin prefijo `/api/v1/` | `background/background.js:9` | **Alta** — Llamaba a `/web-extension/companies/all` en vez de `/api/v1/web-extension/companies/all`, resultando en 404 | Corregido agregando `/api/v1/` al path |
| 3 | `content.js` sin acceso a `CONFIG` | `manifest.json:22` | **Alta** — `content.js` referencia `CONFIG.SEARCH_INPUT_SELECTOR` pero `config.js` no estaba en el array `js` del content_script | Agregado `"config.js"` antes de `"content/content.js"` |
| 4 | Archivos faltantes Fase 2 | `lib/`, `popup/`, `content/` | **Alta** — Directorios creados pero vacios, impidiendo cargar la extension | Creados los 6 archivos faltantes |

---

## Configuracion pendiente (para el usuario)

| Item | Archivo | Valor actual | Accion requerida |
|---|---|---|---|
| URL del backend | `config.js:2` | `'https://<URL_DEL_BACKEND>'` | Reemplazar con la URL real del backend NestJS |
| URL del backend | `manifest.json:9` | `'https://<BACKEND_URL>/*'` | Reemplazar con la URL real |
| Selector CSS del input | `config.js:3` | `'[data-test-id="fr-operator-ContainAny-input"] .Select-multi-value-wrapper input'` | Confirmado por usuario, listo para usar |

---

## Proximo paso

| Fase | Descripcion | Estado |
|---|---|---|
| Fase 3 | Pruebas de integracion: cargar extension en Chrome, verificar flujo completo | Pendiente |
