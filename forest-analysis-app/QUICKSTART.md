# 📚 GUÍA DE INICIO RÁPIDO

## ⚡ Iniciación en 5 Minutos

### 1. Prerequisitos
```bash
Node.js 16+   # nodejs.org
PostgreSQL 12+ # postgresql.org
```

### 2. Crear Base de Datos
```bash
psql -U postgres -c "CREATE DATABASE forest_analysis;"
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tu contraseña de PostgreSQL
npm run migrate
npm run seed
npm run dev
```

### 4. Frontend Setup (en otra terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

### ✅ Listo
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🎬 Scripts de Inicio Automático

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

### Windows
```bash
start.bat
```

---

## 🗺️ Primeros Pasos en la App

1. **Ir al Mapa** (página inicio)
2. **Dibujar polígono:**
   - Click en herramienta Leaflet (panel izquierdo)
   - Hacer clic para puntos
   - Tecla Escape para terminar
3. **Guardar zona:** Click en "💾 Guardar Zona"
4. **Ver reportes automáticos** en panel derecho

---

## 📖 Documentación Completa

Ver `README.md` y `SETUP.md`
