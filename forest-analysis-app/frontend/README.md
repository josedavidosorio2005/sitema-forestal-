# ⚛️ Forest Analysis - Frontend

Frontend React para análisis forestal con Leaflet.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# El valor por defecto debería funcionar

# Iniciar aplicación
npm start
```

Se abrirá en `http://localhost:3000`

## 📁 Estructura

```
src/
├── components/      # Componentes reutilizables
│   ├── Header.js    # Barra de navegación
│   ├── Sidebar.js   # Panel lateral
│   ├── MapComponent.js      # Mapa interactivo
│   ├── ReportPanel.js       # Reportes
│   ├── ZoneForm.js          # Formulario de zonas
│   └── SpeciesForm.js       # Formulario de especies
├── pages/           # Páginas principales
│   ├── HomePage.js          # Página de mapa
│   ├── ZonesPage.js         # Gestión de zonas
│   ├── SpeciesPage.js       # Catálogo de especies
│   └── ReportsPage.js       # Historial de reportes
├── services/        # Llamadas a API
│   └── api.js               # Cliente Axios configurado
├── utils/           # Funciones auxiliares
│   └── helpers.js           # Cálculos y formatos
├── styles/          # CSS global
│   ├── globals.css          # Estilos base
│   └── components.css       # Componentes CSS
├── App.js           # Componente principal con rutas
└── index.js         # Punto de entrada
```

## 🎨 Páginas Principales

### 🗺️ Mapa (Inicio)
- Visualización satelital
- Dibujo de polígonos con Leaflet-Geoman
- Panel lateral con información
- Reporte en tiempo real

### 📍 Mis Zonas
- Listado de zonas guardadas
- Tarjetas con estadísticas
- Editar/eliminar opciones

### 🌿 Catálogo de Especies
- Tabla de especies
- Filtrado por tipo
- Formulario CRUD

### 📊 Reportes
- Historial de análisis
- Detalles completos
- Opción de imprimir

## 🔌 Servicios API

```javascript
// Zonas
zonesService.create(data)
zonesService.getAll()
zonesService.getById(id)
zonesService.update(id, data)
zonesService.delete(id)

// Especies
speciesService.create(data)
speciesService.getAll(type)
speciesService.getById(id)
speciesService.update(id, data)
speciesService.delete(id)

// Reportes
reportsService.create(zoneId, data)
reportsService.getAll()
reportsService.getById(id)
reportsService.getByZoneId(zoneId)
reportsService.update(id, data)
```

## ⚙️ Variables de Entorno

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAP_PROVIDER=osm
```

## 📦 Dependencias Principales

- **react** - UI
- **react-leaflet** - Mapas React
- **leaflet** - Librería de mapas
- **leaflet-geoman-free** - Herramienta de dibujo
- **react-router-dom** - Enrutamiento
- **axios** - HTTP client

## 🧪 Comandos

```bash
npm start       # Desarrollo en http://localhost:3000
npm run build   # Build para producción
npm test        # Ejecutar tests
npm eject       # Eject (irreversible)
```

## 🎯 Características Implementadas

✅ Mapa interactivo con Leaflet  
✅ Dibujo de polígonos  
✅ Cálculo de áreas  
✅ CRUD de zonas  
✅ CRUD de especies  
✅ Generación de reportes  
✅ Interfaz responsive  
✅ Estilos modernos y limpios  

## 🔮 Futuras Mejoras

- [ ] Autenticación de usuarios
- [ ] Exportación a PDF
- [ ] Integración Sentinel-2 real
- [ ] Filtrado geoespacial
- [ ] Gráficos de evolución temporal
- [ ] Notificaciones en tiempo real
- [ ] Soporte offline

## 📝 Notas Técnicas

- Uso de hooks (useState, useEffect)
- Componentes funcionales
- Separación de responsabilidades
- CSS modular por componente
- Formato de código consistente
