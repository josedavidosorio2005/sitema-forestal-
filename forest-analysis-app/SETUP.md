# ⚙️ GUÍA DE INSTALACIÓN Y CONFIGURACIÓN

## 📋 Paso a Paso: Configuración Completa

### 1️⃣ Requisitos del Sistema

**Software necesario:**
- Windows 10+ / macOS / Linux
- [Node.js 16+](https://nodejs.org/) con npm
- [PostgreSQL 12+](https://www.postgresql.org/download/)

**Verificar instalación:**
```bash
node --version
npm --version
psql --version
```

---

## 2️⃣ Configuración de PostgreSQL

### En Windows:

1. Abrir pgAdmin o SQL Shell (psql)
2. Conectarse como usuario `postgres`
3. Crear la base de datos:

```sql
CREATE DATABASE forest_analysis;
```

4. Verificar (opcional):
```sql
\l
```

### En macOS/Linux:

```bash
sudo -u postgres psql
CREATE DATABASE forest_analysis;
\q
```

---

## 3️⃣ Configuración del Backend

### Paso 1: Navegar al directorio

```bash
cd forest-analysis-app/backend
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Debería mostrar:
```
added XX packages
```

### Paso 3: Configurar variables de entorno

Copiar archivo de ejemplo:
```bash
cp .env.example .env
```

Editar `backend/.env` con tus datos (importante):

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forest_analysis
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres    # ← CAMBIAR
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Nota:** Reemplazar `tu_contraseña_postgres` con tu contraseña real.

### Paso 4: Crear tablas en BD

```bash
npm run migrate
```

Salida esperada:
```
✓ Conexión a PostgreSQL exitosa
🔄 Iniciando migración de base de datos...
✓ Tablas creadas exitosamente
```

### Paso 5: Insertar datos de ejemplo

```bash
npm run seed
```

Salida esperada:
```
🌱 Insertando datos de demostración...
✓ Datos de demostración insertados exitosamente
```

### Paso 6: Iniciar el servidor

**Modo desarrollo (con hot-reload):**
```bash
npm run dev
```

O modo producción:
```bash
npm start
```

Salida esperada:
```
╔════════════════════════════════════════╗
║   Forest Analysis Backend API          ║
║   Servidor ejecutándose en puerto 5000 ║
║   http://localhost:5000                ║
╚════════════════════════════════════════╝
```

✅ **Backend listo en `http://localhost:5000`**

---

## 4️⃣ Configuración del Frontend

### En otra terminal:

### Paso 1: Navegar al directorio

```bash
cd forest-analysis-app/frontend
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAP_PROVIDER=osm
```

### Paso 4: Iniciar la aplicación

```bash
npm start
```

Se abrirá automáticamente en `http://localhost:3000`

✅ **Frontend listo en `http://localhost:3000`**

---

## 5️⃣ Verificar que Todo Funciona

### Checklist de Validación:

1. **Backend iniciado** ✓
   - Terminal 1: `npm run dev` en `/backend`
   - Mensaje: "Servidor ejecutándose en puerto 5000"

2. **Frontend iniciado** ✓
   - Terminal 2: `npm start` en `/frontend`
   - Página abierta en navegador

3. **Conectividad** ✓
   - Página carga sin errores
   - Header visible con navegación

4. **Datos de ejemplo** ✓
   - Ir a "Catálogo de Especies"
   - Deberían verse 3 especies de ejemplo

5. **Mapa funcional** ✓
   - Ir a página "Mapa"
   - Mapa visible y navegable

---

## 🗺️ Prueba la Aplicación

### Test Rápido:

1. **Ir al mapa** (inicio)
2. **Dibujar un polígono:**
   - Click en herramienta de polígono (panel izquierdo de Leaflet)
   - Hacer clic en el mapa para cada esquina
   - Click derecho o Escape para terminar
3. **Guardar zona:**
   - Botón "💾 Guardar Zona"
   - Rellenar formulario
   - Verá un reporte automático
4. **Ver catálogo:**
   - Ir a "Catálogo de Especies"
   - Deberá estar poblado con datos de ejemplo
5. **Ver reportes:**
   - Ir a "Reportes"
   - Ver análisis generados

---

## 🔧 Troubleshooting

### ❌ "Error: connect ECONNREFUSED"

**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
# Windows: Services > PostgreSQL
# macOS: brew services list
# Linux: sudo systemctl status postgresql

# Verificar credenciales en backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=correcta
```

### ❌ "Port 5000 already in use"

**Solución:**
```bash
# Cambiar puerto en backend/.env
PORT=5001
```

### ❌ "Cannot find module"

**Solución:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### ❌ "CORS error"

**Solución:**
Verificar que `FRONTEND_URL` en `backend/.env` es correcto:
```env
FRONTEND_URL=http://localhost:3000
```

### ❌ "Mapa no carga"

**Solución:**
1. Revisar consola del navegador (F12)
2. Verificar conexión a internet
3. Limpiar caché: `Ctrl+Shift+Delete`

---

## 📱 Acceso a la Aplicación

### URLs de Trabajo:

| Componente | URL |
|-----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |
| Documentación | README.md del proyecto |

---

## 🚀 Comandos Útiles

### Backend:
```bash
cd backend

# Iniciar desarrollo
npm run dev

# Iniciar producción
npm start

# Crear tablas
npm run migrate

# Insertar datos
npm run seed
```

### Frontend:
```bash
cd frontend

# Iniciar desarrollo
npm start

# Build para producción
npm run build

# Test
npm test
```

---

## ✅ Siguiente Paso

Una vez que todo esté funcionando:

1. **Explorar la interfaz**
2. **Dibujar zonas en el mapa**
3. **Agregar especies al catálogo**
4. **Generar reportes**
5. **Revisar el código** para entender la arquitectura

---

## 📞 Problemas Persistentes?

1. Revisar los logs en la terminal
2. Verificar archivo `.env` (especialmente contraseña)
3. Reiniciar PostgreSQL y Node.js
4. Limpiar cachés: `npm cache clean --force`

---

**¡Listo! 🎉 La aplicación debería estar completamente funcional.**
