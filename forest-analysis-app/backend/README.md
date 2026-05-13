# 🔧 Forest Analysis - Backend

Backend Node.js/Express para análisis forestal.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos de PostgreSQL

# Crear tablas en BD
npm run migrate

# Insertar datos de ejemplo
npm run seed

# Iniciar servidor
npm run dev
```

## 📊 Estructura

- `src/config/` - Configuración (base de datos)
- `src/controllers/` - Lógica de rutas
- `src/models/` - Queries SQL
- `src/routes/` - Definición de endpoints
- `src/utils/` - Funciones auxiliares
- `src/scripts/` - Migración y seed

## 🔌 Endpoints Disponibles

### Zonas
- `POST /api/zones` - Crear zona
- `GET /api/zones` - Listar zonas
- `GET /api/zones/:id` - Ver zona
- `PUT /api/zones/:id` - Editar zona
- `DELETE /api/zones/:id` - Eliminar zona

### Especies
- `POST /api/species` - Crear especie
- `GET /api/species` - Listar (con filtro `?type=nativa`)
- `GET /api/species/:id` - Ver especie
- `PUT /api/species/:id` - Editar especie
- `DELETE /api/species/:id` - Eliminar especie

### Reportes
- `POST /api/reports/zone/:zoneId` - Generar reporte
- `GET /api/reports` - Listar reportes
- `GET /api/reports/:id` - Ver reporte
- `GET /api/reports/zone/:zoneId` - Reportes de zona
- `PUT /api/reports/:id` - Actualizar reporte

## 🛠️ Variables de Entorno

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forest_analysis
DB_USER=postgres
DB_PASSWORD=tu_contraseña
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 📦 Dependencias

- **express** - Framework web
- **pg** - Cliente PostgreSQL
- **cors** - Control de acceso
- **dotenv** - Variables de entorno
- **axios** - Cliente HTTP (futuras APIs)
- **express-validator** - Validación
- **multer** - Manejo de archivos

## 🧪 Comandos

```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
npm run migrate  # Crear tablas
npm run seed     # Datos de ejemplo
```

## 📝 Notas

- Soft delete implementado (deleted_at)
- GeoJSON para coordenadas
- Pool de conexiones a BD
- Manejo de errores centralizado
