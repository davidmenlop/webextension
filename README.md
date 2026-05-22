# HubSpot Company Search — Web Extension

Extensión Chrome/Edge (Manifest V3) que integra búsqueda de empresas HubSpot CRM directamente desde el navegador, con inyección automática de `COD_CLIENTE` en los filtros de reportes nativos de HubSpot.

## Estructura del monorepo

```
.
├── web-extension/          # Chrome/Edge Extension (Manifest V3)
│   ├── manifest.json       # Config V3, permisos, content_scripts
│   ├── config.js           # URL del backend, selectores, TTL caché
│   ├── background/         # Service worker: alarmas de re-sync cada 6h
│   ├── content/            # Content script: inyecta cod_cliente en inputs
│   ├── popup/              # UI del popup: búsqueda fuzzy + resultados
│   ├── lib/                # cache.js (chrome.storage.local) + fuzzy-search.js
│   └── icons/              # Iconos 16/48/128px
│
├── lafazenda-sync-project-main/
│   └── lafazenda-sync-project-main/   # Backend NestJS + Frontend Quasar
│       ├── src/            # NestJS: módulos SAP, HubSpot, SDK, Auth, WebExtension
│       ├── client/         # Quasar/Vue3: CRM Card UI (iframe en HubSpot)
│       ├── test/           # Tests E2E
│       └── aws_project/    # Alternativa AWS Lambda/SQS (Python)
│
├── plan.md                 # Plan de implementación de la extensión
├── AGENTS.md               # Guía para agentes de IA
└── MEMORY.md               # Historial de cambios y decisiones
```

## Funcionalidades de la extensión

- **Búsqueda fuzzy** de empresas por nombre o `cod_cliente` con caché local (24h TTL)
- **Popup ligero** (400×300px) con navegación por teclado (↑↓ Enter)
- **Inyección DOM** automática del `cod_cliente` en filtros de reportes HubSpot
- **Sincronización en segundo plano** cada 6 horas vía `chrome.alarms`
- **Sin token expuesto**: toda comunicación con HubSpot va proxyada por el backend NestJS

## Backend (API)

El módulo `WebExtensionModule` (NestJS) expone:

| Endpoint | Descripción |
|---|---|
| `GET /api/v1/web-extension/companies?limit=&after=` | Listado paginado de empresas |
| `GET /api/v1/web-extension/companies/all` | Descarga completa para seed de caché |
| `GET /api/v1/web-extension/companies/search?q=` | Búsqueda server-side por nombre/cod_cliente |

## Instalación de la extensión

1. Clonar el repo
2. En `web-extension/config.js`, cambiar `BACKEND_URL` por la URL real del backend
3. En Chrome/Edge: `chrome://extensions` → Activar "Modo desarrollador" → "Cargar descomprimida" → seleccionar carpeta `web-extension/`

## Desarrollo del backend

```bash
cd lafazenda-sync-project-main/lafazenda-sync-project-main
npm install
npm run start:dev
```

## Desarrollo del frontend (CRM Card)

```bash
cd lafazenda-sync-project-main/lafazenda-sync-project-main/client
npm install
npm run dev
```
