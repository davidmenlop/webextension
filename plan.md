# Plan: Web Extension HubSpot Company Search

## Arquitectura

```
┌────────────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐
│ Chrome/Edge Extension  │────▶│ NestJS Backend           │────▶│ HubSpot CRM API  │
│                        │     │ /api/v1/web-extension/*  │     │ /companies/search│
│  popup.js ──message──▶ │     │                          │     │ /companies       │
│  content.js (DOM)      │     │                          │     │                  │
└────────────────────────┘     └─────────────────────────┘     └──────────────────┘
```

## Requisitos

- Web Extension para Google Chrome y Microsoft Edge (Manifest V3)
- Listar empresas de HubSpot CRM con búsqueda por nombre o `cod_cliente`
- Al seleccionar una empresa, inyectar el valor de `COD_CLIENTE` en el input de filtro de la página de reportes nativos de HubSpot
- Autenticación vía proxy por el backend NestJS existente (no expone el token en la extensión)
- UI tipo popup (ventana emergente al hacer clic en el ícono)

---

## 1. Backend NestJS — Nuevo módulo `WebExtensionModule`

### 1.1 Archivos a crear

| Archivo | Propósito |
|---|---|
| `src/web-extension/web-extension.module.ts` | Declara el módulo |
| `src/web-extension/web-extension.controller.ts` | Endpoints REST |
| `src/web-extension/web-extension.service.ts` | Lógica de búsqueda vía HubSpot |

### 1.2 Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/web-extension/companies?limit=100&after=X` | Listar empresas con paginación |
| `GET` | `/api/v1/web-extension/companies/all` | Obtener todas las empresas para sincronización de caché local |
| `GET` | `/api/v1/web-extension/companies/search?q=term` | Buscar por nombre o `cod_cliente` |

### 1.3 Lógica de búsqueda

**Request a HubSpot CRM Search API** (`POST /crm/v3/objects/companies/search`):

```json
{
  "filterGroups": [
    {
      "filters": [
        { "propertyName": "name", "operator": "CONTAINS_TOKEN", "value": "term" }
      ]
    },
    {
      "filters": [
        { "propertyName": "cod_cliente", "operator": "CONTAINS_TOKEN", "value": "term" }
      ]
    }
  ],
  "properties": ["name", "cod_cliente"],
  "limit": 50
}
```

Dos `filterGroups` = OR lógico entre grupos (coincide en nombre O en `cod_cliente`).

**Listar sin filtro** usa `GET /crm/v3/objects/companies?properties=name,cod_cliente&limit=100`.

**Endpoint `/all` para sincronización de caché**: Itera todas las páginas de HubSpot (usando cursor `after`) hasta recolectar la totalidad de empresas. Retorna un array plano con todos los registros:

```json
{
  "companies": [
    { "name": "Distribuidora ABC S.A.", "cod_cliente": "C00145" },
    { "name": "Minera Escondida Ltda.", "cod_cliente": "ME-002" }
  ],
  "total": 2450,
  "syncedAt": "2026-05-20T14:30:00Z"
}
```

### 1.4 Formato de respuesta

```json
{
  "results": [
    { "id": "123456789", "name": "Distribuidora ABC S.A.", "cod_cliente": "C00145" }
  ],
  "paging": {
    "next": { "after": "50" }
  }
}
```

Solo se exponen `id`, `name`, `cod_cliente`. El `id` es para uso interno; el valor inyectado al DOM es `cod_cliente`.

### 1.5 Registro del módulo

Agregar `WebExtensionModule` al array `imports` en `src/app.module.ts`.

### 1.6 Autenticación

Reutiliza `INTEGRATIONS.hubspot.apiV3` (Axios instance con `Authorization: Bearer ${HUBSPOT_TOKEN}`), ya configurado en `src/utils/config/integrations.config.ts`.

---

## 2. Chrome/Edge Extension — Manifest V3

### 2.1 Estructura de archivos

```
web-extension/
├── manifest.json
├── config.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/
│   └── content.js
├── background/
│   └── background.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 2.2 `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "HubSpot Company Search",
  "version": "1.0.0",
  "description": "Busca empresas en HubSpot CRM y aplica filtros por COD_CLIENTE en reportes.",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": [
    "*://app.hubspot.com/*",
    "https://<BACKEND_URL>/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["*://app.hubspot.com/reports/*"],
      "js": ["content/content.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background/background.js"
  }
}
```

### 2.3 `config.js` — Configuración centralizada

```js
const CONFIG = {
  BACKEND_URL: 'https://<URL_DEL_BACKEND>',
  SEARCH_INPUT_SELECTOR: '[data-test-id="fr-operator-ContainAny-input"] .Select-multi-value-wrapper input',
};
```

### 2.4 `popup/popup.html` — UI de búsqueda

- Campo de texto para búsqueda
- Lista de resultados con scroll
- Indicador de carga
- Indicador de estado de caché (sincronizado / sincronizando)
- Cada item muestra: `[cod_cliente] nombre`

### 2.5 `popup/popup.js` — Lógica del popup con caché local y Fuzzy Search

Flujo completo:

1. **Carga de caché**: Al abrir el popup, verifica `chrome.storage.local`:
   - Si existe y tiene menos de 24h de antigüedad: usa los datos en memoria.
   - Si no existe o expiró: llama `GET /web-extension/companies/all`, guarda en `chrome.storage.local` con timestamp.
   - Mientras sincroniza, muestra indicador de carga.

2. **Búsqueda fuzzy client-side (sin debounce)**: Al escribir en el input, filtra el array en memoria con algoritmo fuzzy:
   - `FuzzySearch(term, companies)` → normaliza el término y cada nombre/código (minúsculas, sin tildes).
   - Aplica distancia de Levenshtein con umbral de tolerancia de ~2 caracteres para absorber typos.
   - Prioriza coincidencias exactas de prefijo sobre coincidencias intermedias.
   - Muestra los top 20 resultados en la lista.

3. **Sincronización en background**: Opcionalmente, un `alarm` en el service worker re-sincroniza cada 6 horas para mantener el caché fresco sin bloquear la UI.

4. **Selección de empresa**: Al hacer clic en un item:
   - Envía mensaje al content script: `chrome.tabs.sendMessage(tabId, { action: "fillCodCliente", value: cod_cliente })`
   - Cierra el popup.

### 2.6 `popup/popup.css` — Estilos

Diseño compacto (400px ancho x 500px alto), lista con hover states, campo de búsqueda sticky en el top.

### 2.7 `content/content.js` — Inyección en el DOM

Basado en el script de referencia:

```js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== 'fillCodCliente') return;

  const observer = new MutationObserver(() => {
    const wrapper = document.querySelector(
      '[data-test-id="fr-operator-ContainAny-input"] .Select-multi-value-wrapper input'
    );
    if (!wrapper) return;
    observer.disconnect();

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      wrapper.ownerDocument.defaultView.HTMLInputElement.prototype, 'value'
    ).set;

    nativeInputValueSetter.call(wrapper, msg.value);
    wrapper.dispatchEvent(new Event('input', { bubbles: true }));
    wrapper.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', keyCode: 13, which: 13, bubbles: true
    }));
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
```

**Puntos clave:**
- `MutationObserver` espera a que el input del filtro esté disponible (los reportes cargan dinámicamente).
- `nativeInputValueSetter` bypassea el control de React sobre el input y setea el valor nativo.
- `dispatchEvent('input')` activa el `onChange` de React para que el filtro se aplique.
- `dispatchEvent(KeyboardEvent Enter)` confirma el filtro (simula presionar Enter).

### 2.8 `background/background.js` — Service Worker

- Puente de mensajería entre popup y content script cuando sea necesario (el popup puede usar `chrome.tabs.sendMessage` directamente).
- **Alarm de re-sincronización**: `chrome.alarms.create('syncCache', { periodInMinutes: 360 })` para refrescar el caché de empresas cada 6 horas en segundo plano sin bloquear la UI.

---

## 3. Orden de implementación

| Paso | Descripción | Archivos |
|---|---|---|
| 1 | Crear `WebExtensionModule` (module, controller, service) incluyendo endpoint `/all` | `src/web-extension/*` |
| 2 | Registrar módulo en `app.module.ts` | `src/app.module.ts` |
| 3 | Crear estructura de la extensión | `web-extension/` |
| 4 | `manifest.json` + íconos | `web-extension/manifest.json`, `web-extension/icons/` |
| 5 | `lib/fuzzy-search.js` — Algoritmo de búsqueda difusa client-side | `web-extension/lib/fuzzy-search.js` |
| 6 | `lib/cache.js` — Gestión de caché en `chrome.storage.local` con TTL | `web-extension/lib/cache.js` |
| 7 | Popup UI (HTML + CSS + JS con búsqueda fuzzy y caché) | `web-extension/popup/*` |
| 8 | Content script con MutationObserver | `web-extension/content/content.js` |
| 9 | `config.js` y `background.js` con alarm de re-sincronización | `web-extension/config.js`, `web-extension/background/background.js` |

---

## 4. Configuración pendiente

| Item | Valor requerido |
|---|---|
| URL pública del backend NestJS | `https://...` (para `BACKEND_URL` y `host_permissions`) |
| Selector CSS del input | `[data-test-id="fr-operator-ContainAny-input"] .Select-multi-value-wrapper input` (confirmado por el usuario) |

---

## 5. Referencias

- HubSpot Companies API: `https://api.hubapi.com/crm/v3/objects/companies`
- HubSpot CRM Search: `POST /crm/v3/objects/companies/search` (filtro `CONTAINS_TOKEN`)
- Manifest V3: https://developer.chrome.com/docs/extensions/mv3/
- Projecto base: `lafazenda-sync-project-main` (NestJS + HubSpot integration)
