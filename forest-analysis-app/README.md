# Forest Analysis

Aplicacion web full stack para analisis forestal sobre mapas interactivos. El MVP permite dibujar poligonos, guardar zonas, calcular area, administrar un catalogo manual de especies arboreas y generar reportes con cobertura vegetal simulada.

Importante: la app no promete identificar especies exactas por IA. El reporte separa especies probables, derivadas del catalogo y region del cliente, de especies confirmadas manualmente.

## Stack

Frontend:
- React.js
- React-Leaflet
- Leaflet
- Geoman para dibujo de poligonos
- Axios
- CSS responsive

Backend:
- Node.js
- Express.js
- API REST
- PostgreSQL preparado
- PostGIS opcional
- SQLite como modo local rapido sin instalar base de datos

## Estructura

```text
forest-analysis-app/
  backend/
    src/
      config/
      controllers/
      models/
      routes/
      services/
      scripts/
      utils/
  frontend/
    src/
      components/
      pages/
      services/
      styles/
      utils/
```

## Ejecucion rapida con SQLite

Este modo sirve para probar el MVP de inmediato.

```powershell
cd "C:\Users\Usuario\OneDrive\Escritorio\malpirdos todos\forest-analysis-app"

cd backend
npm install
$env:DB_CLIENT="sqlite"
npm run migrate
npm run seed
npm start
```

En otra terminal:

```powershell
cd "C:\Users\Usuario\OneDrive\Escritorio\malpirdos todos\forest-analysis-app\frontend"
npm install
npm start
```

URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000/api/health`

Tambien puedes usar `start.bat` en Windows. Si no defines `DB_CLIENT`, arranca con SQLite.

## Ejecucion con PostgreSQL

1. Crear base de datos:

```sql
CREATE DATABASE forest_analysis;
```

2. Configurar `backend/.env` desde `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000,http://127.0.0.1:3000
DB_CLIENT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forest_analysis
DB_USER=postgres
DB_PASSWORD=postgres
ENABLE_POSTGIS=false
AUTO_MIGRATE=true
```

3. Instalar, migrar y sembrar datos:

```powershell
cd backend
npm install
npm run migrate
npm run seed
npm start
```

Si tienes PostGIS instalado, cambia `ENABLE_POSTGIS=true`. La migracion agrega una columna `geom geometry(Polygon, 4326)` e indice GIST, manteniendo `geometry_geojson` como estructura base.

## Variables de entorno

Backend: `backend/.env.example`
- `DB_CLIENT`: `postgres` o `sqlite`
- `DATABASE_URL`: alternativa completa para PostgreSQL
- `ENABLE_POSTGIS`: activa estructura PostGIS si esta disponible
- `SQLITE_FILE`: ruta del archivo SQLite local
- `AUTO_MIGRATE`: crea tablas al arrancar si esta en `true`

Frontend: `frontend/.env.example`
- `REACT_APP_API_URL=http://localhost:5000/api`
- placeholders para Mapbox o Google Maps futuros

## Endpoints principales

Zonas:
- `POST /api/zones`
- `GET /api/zones`
- `GET /api/zones/:id`
- `DELETE /api/zones/:id`
- `GET /api/zones/:id/report`

Especies:
- `POST /api/species`
- `GET /api/species`
- `GET /api/species/:id`
- `PUT /api/species/:id`
- `DELETE /api/species/:id`

Reportes:
- `POST /api/reports`
- `GET /api/reports`
- `GET /api/reports/:id`
- `GET /api/zones/:id/report`

## Integraciones preparadas

Los servicios estan separados para reemplazar la simulacion por proveedores reales:
- `backend/src/services/vegetationService.js`: preparado para Sentinel-2/Copernicus y NDVI real.
- `backend/src/services/speciesMatchService.js`: preparado para GBIF/iNaturalist o reglas regionales mas avanzadas.
- Frontend deja capa OSM por defecto y capa satelital Esri disponible; `.env.example` deja placeholders para Mapbox/Google Maps.

## Verificacion local realizada

- `npm run build` en frontend: correcto.
- Migracion y seed con SQLite: correcto.
- API probada: health, zonas, reportes, CRUD de especies.
- Captura visual con navegador headless: mapa, panel lateral y navegacion renderizan correctamente.
