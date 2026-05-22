# Web Extension API — Documentacion de Endpoints

> Base URL: `{BACKEND}/api/v1/web-extension`

## Endpoints

### 1. Buscar empresas

```
GET /companies/search?q={termino}
```

Busca empresas en HubSpot CRM por coincidencia parcial en `name` o `cod_cliente`.

**Query params:**

| Param | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `q` | string | Si | Termino de busqueda. Se aplica con logica OR sobre `name` y `cod_cliente`. |

**Ejemplo — busqueda por nombre:**

```
GET /api/v1/web-extension/companies/search?q=MANUEL%20EDUARDO%20CARMONA%20PERTUZ
```

#### ?Que envia el backend a HubSpot?

El backend traduce la query a un `POST /crm/v3/objects/companies/search` con:

```json
{
  "filterGroups": [
    { "filters": [{ "propertyName": "name", "operator": "CONTAINS_TOKEN", "value": "MANUEL EDUARDO CARMONA PERTUZ" }] },
    { "filters": [{ "propertyName": "cod_cliente", "operator": "CONTAINS_TOKEN", "value": "MANUEL EDUARDO CARMONA PERTUZ" }] }
  ],
  "properties": ["name", "cod_cliente"],
  "limit": 50
}
```

`CONTAINS_TOKEN` tokeniza el termino en palabras individuales (`MANUEL`, `EDUARDO`, `CARMONA`, `PERTUZ`) y busca empresas cuyo `name` o `cod_cliente` contenga al menos uno de esos tokens. Esto significa que una busqueda por "MANUEL" ya encontraria esta empresa.

#### ?Que retorna la API al front?

**Caso 1 — Empresa encontrada** (HTTP 200):

```json
{
  "results": [
    {
      "id": "123456789",
      "name": "MANUEL EDUARDO CARMONA PERTUZ",
      "cod_cliente": "C00145"
    }
  ]
}
```

| Campo | Tipo | Descripcion |
|---|---|---|
| `results[].id` | string | ID interno de HubSpot (no se muestra en el popup) |
| `results[].name` | string | Nombre de la empresa registrado en HubSpot |
| `results[].cod_cliente` | string \| null | Codigo de cliente SAP. `null` si la empresa no lo tiene asignado. |

**Caso 2 — Sin resultados** (HTTP 200):

```json
{
  "results": []
}
```

**Caso 3 — Parametro `q` vacio o ausente** (HTTP 400):

```json
{
  "statusCode": 400,
  "message": "Query parameter \"q\" is required",
  "error": "Bad Request"
}
```

**Caso 4 — Error del servidor / HubSpot no disponible** (HTTP 500):

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

### 2. Listar empresas (paginado)

```
GET /companies?limit={n}&after={cursor}
```

**Query params:**

| Param | Tipo | Requerido | Default | Descripcion |
|---|---|---|---|---|
| `limit` | number | No | 100 | Cantidad maxima por pagina |
| `after` | string | No | — | Cursor de paginacion (viene del `paging.next.after` de la respuesta anterior) |

**Respuesta** (HTTP 200):

```json
{
  "results": [
    { "id": "123456789", "name": "ACME Corp", "cod_cliente": "C001" },
    { "id": "987654321", "name": "Beta Inc", "cod_cliente": null }
  ],
  "paging": {
    "next": {
      "after": "50"
    }
  }
}
```

Si no hay mas paginas, `paging` no se incluye en la respuesta.

---

### 3. Obtener todas las empresas (sincronizacion de cache)

```
GET /companies/all
```

Itera todas las paginas de HubSpot hasta recolectar el 100% de las empresas. Usado por la extension para sembrar el cache local en `chrome.storage.local`.

**Respuesta** (HTTP 200):

```json
{
  "companies": [
    { "id": "123456789", "name": "ACME Corp", "cod_cliente": "C001" },
    { "id": "987654321", "name": "Beta Inc", "cod_cliente": null }
  ],
  "total": 2450,
  "syncedAt": "2026-05-20T19:45:00.000Z"
}
```

| Campo | Tipo | Descripcion |
|---|---|---|
| `companies` | array | Lista plana con TODAS las empresas |
| `total` | number | Total de empresas retornadas |
| `syncedAt` | string | Timestamp ISO 8601 del momento de la sincronizacion |

---

## Formato de CompanyResult

Todas las respuestas usan el mismo objeto `CompanyResult`:

```typescript
{
  id: string;           // ID interno de HubSpot
  name: string;         // Nombre de la empresa (nunca null, minimo string vacio)
  cod_cliente: string | null;  // Codigo de cliente SAP (null si no tiene)
}
```

## Flujo de datos completo

```
Extension (popup.js)
  │
  │  fetch( BACKEND_URL + '/api/v1/web-extension/companies/search?q=MANUEL...' )
  │
  ▼
NestJS Controller  ──valida q, trim whitespace──▶  WebExtensionService
                                                       │
                                                       │  POST /crm/v3/objects/companies/search
                                                       │  { filterGroups: [...], properties: [...], limit: 50 }
                                                       ▼
                                                   HubSpot CRM API
                                                       │
                                                       │  { results: [{ id, properties: { name, cod_cliente } }] }
                                                       ▼
                                                   WebExtensionService
                                                   ──mapea a { id, name, cod_cliente }──▶  Controller
                                                                                              │
                                                                                              │  JSON response
                                                                                              ▼
                                                                                          Extension (popup.js)
```

## Codigos de error

| HTTP | Condicion |
|---|---|
| 200 | Exito (con o sin resultados) |
| 400 | Falta el parametro `q` o esta vacio |
| 401 | Token de HubSpot invalido/expirado (desde HubSpot) |
| 500 | Error interno del servidor o HubSpot no disponible |
