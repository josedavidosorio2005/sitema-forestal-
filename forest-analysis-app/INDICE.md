# 📑 ÍNDICE DE ARCHIVOS - Forest Analysis

## Actualizacion funcional

- `backend/src/routes/calculations.js` y `backend/src/utils/logDragTension.js`: endpoint y motor de calculo para extraccion de troncos.
- `frontend/src/pages/ExtractionCalculatorPage.js`: pantalla web de extraccion con salida JSON tecnica.
- `frontend/src/components/MapComponent.js`: buscador de lugares por direccion, finca, vereda o coordenadas.
- `vercionde pc/src/...`: misma calculadora y buscador para la version de computador.
- `lamda vercion de andid/src/...`: misma calculadora y buscador para la version movil Android.

## 📂 Estructura Completa del Proyecto

```
forest-analysis-app/
│
├── 📄 README.md                 # Guía principal del proyecto
├── 📄 SETUP.md                  # Guía de instalación detallada
├── 📄 QUICKSTART.md             # Inicio rápido (5 minutos)
├── 📄 API.md                    # Documentación de endpoints
├── 📄 RESUMEN.md                # Resumen ejecutivo (este archivo)
├── 📄 .gitignore                # Configuración de Git
│
├── 🔧 start.sh                  # Script inicio (Linux/Mac)
├── 🔧 start.bat                 # Script inicio (Windows)
│
├── 📁 backend/
│   │
│   ├── 📄 package.json          # Dependencias NPM
│   ├── 📄 .env.example          # Variables de entorno (template)
│   ├── 📄 README.md             # Documentación backend
│   │
│   └── 📁 src/
│       │
│       ├── 📄 index.js          # 🎯 PUNTO DE ENTRADA SERVIDOR
│       │
│       ├── 📁 config/
│       │   └── database.js      # Configuración PostgreSQL
│       │
│       ├── 📁 controllers/
│       │   ├── zonesController.js       # CRUD zonas
│       │   ├── speciesController.js     # CRUD especies
│       │   └── reportsController.js     # CRUD reportes
│       │
│       ├── 📁 models/
│       │   └── queries.js       # Todas las queries SQL
│       │
│       ├── 📁 routes/
│       │   ├── zones.js         # GET/POST /api/zones
│       │   ├── species.js       # GET/POST /api/species
│       │   └── reports.js       # GET/POST /api/reports
│       │
│       ├── 📁 utils/
│       │   ├── errors.js        # Manejo de errores
│       │   └── geojson.js       # Cálculos de geometría
│       │
│       └── 📁 scripts/
│           ├── migrate.js       # Crear tablas (npm run migrate)
│           └── seed.js          # Datos de ejemplo (npm run seed)
│
├── 📁 frontend/
│   │
│   ├── 📄 package.json          # Dependencias NPM
│   ├── 📄 .env.example          # Variables de entorno (template)
│   ├── 📄 README.md             # Documentación frontend
│   │
│   ├── 📁 public/
│   │   ├── index.html           # 🎯 Página HTML principal
│   │   └── manifest.json        # Metadatos PWA
│   │
│   └── 📁 src/
│       │
│       ├── 📄 index.js          # Punto de entrada React
│       ├── 📄 App.js            # Componente raíz con rutas
│       ├── 📄 App.css           # Estilos de App
│       │
│       ├── 📁 components/       # Componentes reutilizables
│       │   ├── Header.js        # Barra de navegación
│       │   ├── Header.css
│       │   ├── Sidebar.js       # Panel lateral
│       │   ├── Sidebar.css
│       │   ├── MapComponent.js  # 🗺️ Mapa interactivo Leaflet
│       │   ├── MapComponent.css
│       │   ├── ReportPanel.js   # Mostrador de reportes
│       │   ├── ReportPanel.css
│       │   ├── ZoneForm.js      # Formulario de zonas
│       │   ├── ZoneForm.css
│       │   ├── SpeciesForm.js   # Formulario de especies
│       │   └── SpeciesForm.css
│       │
│       ├── 📁 pages/            # Páginas principales
│       │   ├── HomePage.js      # 🗺️ Página de mapa (inicio)
│       │   ├── HomePage.css
│       │   ├── ZonesPage.js     # 📍 Gestión de zonas
│       │   ├── ZonesPage.css
│       │   ├── SpeciesPage.js   # 🌿 Catálogo de especies
│       │   ├── SpeciesPage.css
│       │   ├── ReportsPage.js   # 📊 Historial de reportes
│       │   └── ReportsPage.css
│       │
│       ├── 📁 services/
│       │   └── api.js           # Cliente Axios configurado
│       │
│       ├── 📁 utils/
│       │   └── helpers.js       # Funciones auxiliares
│       │
│       └── 📁 styles/           # Estilos globales
│           ├── globals.css      # Estilos base
│           └── components.css   # Componentes CSS reutilizables
```

---

## 🎯 Archivos Clave

### Backend

| Archivo | Descripción | Responsable |
|---------|-----------|-----------|
| `src/index.js` | Servidor principal | Inicio |
| `src/config/database.js` | Conexión PostgreSQL | BD |
| `src/models/queries.js` | Todas las queries SQL | Datos |
| `src/controllers/*` | Lógica de negocio | API |
| `src/routes/*` | Definición de endpoints | Rutas |
| `.env.example` | Template configuración | Setup |

### Frontend

| Archivo | Descripción | Componente |
|---------|-----------|----------|
| `src/index.js` | Punto de entrada React | Inicio |
| `src/App.js` | Componente raíz con rutas | Enrutamiento |
| `src/components/*` | Componentes reutilizables | UI |
| `src/pages/*` | Páginas principales | Vistas |
| `src/services/api.js` | Cliente HTTP | Comunicación |
| `src/styles/*` | Estilos CSS | Diseño |

---

## 📝 Documentación

| Archivo | Contenido |
|---------|----------|
| `README.md` | 📖 Guía completa del proyecto |
| `SETUP.md` | 🔧 Instalación paso a paso |
| `QUICKSTART.md` | ⚡ Inicio en 5 minutos |
| `API.md` | 📚 Referencia de endpoints |
| `RESUMEN.md` | 📋 Resumen ejecutivo |

---

## 🚀 Comandos Importantes

### Backend
```bash
cd backend

npm install              # Instalar dependencias
npm run dev             # Desarrollar con nodemon
npm start               # Producción
npm run migrate         # Crear tablas BD
npm run seed            # Datos de ejemplo
```

### Frontend
```bash
cd frontend

npm install              # Instalar dependencias
npm start               # Desarrollar
npm run build           # Build producción
npm test                # Tests
```

### General
```bash
./start.sh              # Inicio automático (Mac/Linux)
start.bat               # Inicio automático (Windows)
```

---

## 🗂️ Cómo Navegar

### Para Entender la Estructura
1. Leer `README.md` para visión general
2. Ver `RESUMEN.md` para características
3. Revisar este archivo para ubicación de componentes

### Para Instalar
1. Seguir `SETUP.md` paso a paso
2. O usar `QUICKSTART.md` (5 minutos)

### Para Desarrollar
1. Revisar código backend en `src/`
2. Revisar código frontend en `src/`
3. Consultar `API.md` para endpoints

### Para Problemas
1. Revisar sección troubleshooting en `SETUP.md`
2. Ver logs en terminal
3. Revisar `.env` files

---

## 📊 Conteo de Archivos

### Backend
- Controllers: 3
- Routes: 3
- Utils: 2
- Scripts: 2
- Config: 1
- Models: 1
- **Total:** ~12 archivos principales

### Frontend
- Components: 6 (con CSS)
- Pages: 4 (con CSS)
- Services: 1
- Utils: 1
- Styles: 2
- Config: 3 (HTML, manifest, index.js)
- **Total:** ~20 archivos principales

### Documentación
- README
- SETUP
- QUICKSTART
- API
- RESUMEN (este)
- Backend README
- Frontend README
- **Total:** 7 documentos

---

## 🔄 Flujo de Archivos

### Iniciación Backend
```
index.js
  ↓
config/database.js (conexión)
  ↓
routes/ (endpoints)
  ↓
controllers/ (lógica)
  ↓
models/queries.js (datos)
```

### Iniciación Frontend
```
index.js
  ↓
App.js (rutas)
  ↓
pages/ (vistas)
  ↓
components/ (UI)
  ↓
services/api.js (backend)
```

---

## 🎯 Punto de Inicio Recomendado

### Primer Vistazo
1. `README.md` (5 min)
2. `QUICKSTART.md` (2 min)
3. Ver estructura en este archivo

### Para Instalar
1. `SETUP.md` (10-15 min)
2. Ejecutar comandos indicados

### Para Desarrollar
1. `backend/README.md`
2. `frontend/README.md`
3. `API.md` para endpoints

### Para Producción
1. Revisar `RESUMEN.md`
2. Configurar variables `.env`
3. Ejecutar `npm run migrate`
4. Ejecutar `npm start`

---

## ✅ Checklist de Navegación

- [ ] He leído `README.md`
- [ ] He seguido `SETUP.md`
- [ ] Tengo backend corriendo
- [ ] Tengo frontend corriendo
- [ ] Puedo acceder a `http://localhost:3000`
- [ ] Puedo dibujar en el mapa
- [ ] Puedo guardar zonas
- [ ] Puedo ver reportes
- [ ] He leído `API.md`
- [ ] Entiendo la estructura del proyecto

---

**🎉 ¡Proyecto listo para explorar!**

Para cualquier pregunta, revisa la documentación correspondiente.
