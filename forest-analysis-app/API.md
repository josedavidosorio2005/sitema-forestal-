# 📚 DOCUMENTACIÓN DE API

## 🔌 Forest Analysis API Reference

**Base URL:** `http://localhost:5000/api`

---

## CALCULOS FORESTALES

### POST /calculations/log-drag-tension
Calcula tension de arrastre de troncos y devuelve un JSON tecnico estricto.

**Request:**
```json
{
  "peso_tronco": 1200,
  "angulo_pendiente": 18,
  "tipo_suelo": "tierra_seca",
  "distancia_arrastre": 35
}
```

**tipo_suelo permitido:** `pasto`, `tierra_seca`, `lodo`, `grava`.

**Response (200):**
```json
{
  "tension_estatica_kN": 8.12,
  "tension_con_seguridad_kN": 40.58,
  "mbs_recomendado_kg": 4137,
  "coeficiente_friccion_usado": 0.4,
  "alertas": [
    "Carga de choque: evita tirones bruscos y usa arranque progresivo."
  ],
  "material_sugerido": "Poliester trenzado de baja elongacion."
}
```

---

## 🏥 Health Check

### GET /health
Verifica que el servidor está operacional.

**Response (200):**
```json
{
  "success": true,
  "message": "Backend operacional",
  "timestamp": "2024-05-12T10:30:00.000Z"
}
```

---

## 📍 ZONAS

### POST /zones
Crear una nueva zona dibujada.

**Request:**
```json
{
  "name": "Bosque del Norte",
  "description": "Zona de pinos blancos",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [[-74.5, 40.1], [-74.4, 40.1], [-74.4, 40.2], [-74.5, 40.2], [-74.5, 40.1]]
    ]
  },
  "area_m2": 8940000,
  "area_ha": 894
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Zona creada exitosamente",
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Bosque del Norte",
    "description": "Zona de pinos blancos",
    "geometry": { ... },
    "area_m2": 8940000,
    "area_ha": 894,
    "created_at": "2024-05-12T10:00:00Z",
    "updated_at": "2024-05-12T10:00:00Z"
  }
}
```

---

### GET /zones
Listar todas las zonas del usuario.

**Query Parameters:**
- Ninguno requerido

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bosque del Norte",
      "area_m2": 8940000,
      "area_ha": 894,
      "created_at": "2024-05-12T10:00:00Z"
    }
  ]
}
```

---

### GET /zones/:id
Obtener detalle de una zona específica.

**Parameters:**
- `id` (number, required) - ID de la zona

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Bosque del Norte",
    "description": "Zona de pinos blancos",
    "geometry": { ... },
    "area_m2": 8940000,
    "area_ha": 894,
    "created_at": "2024-05-12T10:00:00Z"
  }
}
```

---

### PUT /zones/:id
Actualizar información de una zona.

**Parameters:**
- `id` (number, required) - ID de la zona

**Request:**
```json
{
  "name": "Bosque del Norte - Actualizado",
  "description": "Nueva descripción"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Zona actualizada exitosamente",
  "data": { ... }
}
```

---

### DELETE /zones/:id
Eliminar una zona (soft delete).

**Parameters:**
- `id` (number, required) - ID de la zona

**Response (200):**
```json
{
  "success": true,
  "message": "Zona eliminada exitosamente"
}
```

---

## 🌿 ESPECIES

### POST /species
Crear una nueva especie en el catálogo.

**Request:**
```json
{
  "common_name": "Pino Blanco",
  "scientific_name": "Pinus strobus",
  "type": "nativa",
  "description": "Conífera de gran porte",
  "region": "Zonas templadas",
  "image_url": "https://example.com/pine.jpg",
  "observations": "Adaptable a diversos suelos"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Especie creada exitosamente",
  "data": {
    "id": 1,
    "user_id": 1,
    "common_name": "Pino Blanco",
    "scientific_name": "Pinus strobus",
    "type": "nativa",
    "description": "Conífera de gran porte",
    "region": "Zonas templadas",
    "image_url": "https://example.com/pine.jpg",
    "observations": "Adaptable a diversos suelos",
    "created_at": "2024-05-12T10:00:00Z"
  }
}
```

---

### GET /species
Listar especies con filtrado opcional.

**Query Parameters:**
- `type` (string, optional) - Filtrar por tipo: nativa, introducida, invasora, ornamental, comercial

**Examples:**
```
GET /api/species
GET /api/species?type=nativa
GET /api/species?type=invasora
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "common_name": "Pino Blanco",
      "scientific_name": "Pinus strobus",
      "type": "nativa",
      "region": "Zonas templadas"
    }
  ]
}
```

---

### GET /species/:id
Obtener detalle de una especie.

**Parameters:**
- `id` (number, required) - ID de la especie

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "common_name": "Pino Blanco",
    "scientific_name": "Pinus strobus",
    "type": "nativa",
    "description": "Conífera de gran porte",
    "region": "Zonas templadas",
    "image_url": "https://example.com/pine.jpg",
    "observations": "Adaptable a diversos suelos",
    "created_at": "2024-05-12T10:00:00Z"
  }
}
```

---

### PUT /species/:id
Actualizar una especie.

**Parameters:**
- `id` (number, required) - ID de la especie

**Request:**
```json
{
  "common_name": "Pino Blanco",
  "scientific_name": "Pinus strobus",
  "type": "nativa",
  "description": "Actualizada",
  "region": "Zonas templadas",
  "image_url": "https://example.com/pine-new.jpg",
  "observations": "Nueva observación"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Especie actualizada exitosamente",
  "data": { ... }
}
```

---

### DELETE /species/:id
Eliminar una especie.

**Parameters:**
- `id` (number, required) - ID de la especie

**Response (200):**
```json
{
  "success": true,
  "message": "Especie eliminada exitosamente"
}
```

---

## 📊 REPORTES

### POST /reports/zone/:zoneId
Generar un reporte de análisis para una zona.

**Parameters:**
- `zoneId` (number, required) - ID de la zona

**Request:**
```json
{
  "region": "Zonas templadas",
  "confirmed_species": [
    {
      "id": 1,
      "common_name": "Pino Blanco"
    }
  ],
  "observations": "Zona en buen estado"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Reporte creado exitosamente",
  "data": {
    "id": 1,
    "zone_id": 1,
    "vegetation_coverage": 75,
    "forest_density": "alto",
    "probable_species": [
      {
        "id": 1,
        "common_name": "Pino Blanco",
        "scientific_name": "Pinus strobus",
        "probability": 0.85
      }
    ],
    "confirmed_species": [
      {
        "id": 1,
        "common_name": "Pino Blanco"
      }
    ],
    "observations": "Zona en buen estado",
    "created_at": "2024-05-12T10:00:00Z"
  }
}
```

---

### GET /reports
Listar todos los reportes del usuario.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "zone_id": 1,
      "vegetation_coverage": 75,
      "forest_density": "alto",
      "created_at": "2024-05-12T10:00:00Z"
    }
  ]
}
```

---

### GET /reports/:id
Obtener un reporte específico.

**Parameters:**
- `id` (number, required) - ID del reporte

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "zone_id": 1,
    "vegetation_coverage": 75,
    "forest_density": "alto",
    "probable_species": [ ... ],
    "confirmed_species": [ ... ],
    "observations": "Zona en buen estado",
    "created_at": "2024-05-12T10:00:00Z"
  }
}
```

---

### GET /reports/zone/:zoneId
Listar reportes de una zona específica.

**Parameters:**
- `zoneId` (number, required) - ID de la zona

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "zone_id": 1,
      "vegetation_coverage": 75,
      "forest_density": "alto",
      "created_at": "2024-05-12T10:00:00Z"
    }
  ]
}
```

---

### PUT /reports/:id
Actualizar un reporte existente.

**Parameters:**
- `id` (number, required) - ID del reporte

**Request:**
```json
{
  "vegetation_coverage": 80,
  "forest_density": "alto",
  "confirmed_species": [ ... ],
  "observations": "Actualización del análisis"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reporte actualizado exitosamente",
  "data": { ... }
}
```

---

## 🔴 Códigos de Error

### 400 Bad Request
Datos inválidos o incompletos.
```json
{
  "success": false,
  "message": "Nombre y geometría son requeridos"
}
```

### 404 Not Found
Recurso no encontrado.
```json
{
  "success": false,
  "message": "Zona no encontrada"
}
```

### 500 Internal Server Error
Error del servidor.
```json
{
  "success": false,
  "message": "Error interno del servidor"
}
```

---

## 📋 Tipos de Especies

Valores válidos para el campo `type`:
- `nativa` - Especie originaria de la región
- `introducida` - Especie traída de otra región
- `invasora` - Especie invasiva
- `ornamental` - Especie ornamental
- `comercial` - Especie comercial

---

## 📊 Niveles de Densidad Forestal

Posibles valores para `forest_density`:
- `bajo` - Menos del 40% de cobertura
- `medio` - Entre 40% y 70% de cobertura
- `alto` - Más del 70% de cobertura

---

## 🗺️ Formato GeoJSON

Las coordenadas se envían en formato GeoJSON:

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [lng, lat],
      [lng, lat],
      [lng, lat],
      [lng, lat]
    ]
  ]
}
```

**Nota:** El formato es [Longitud, Latitud], no [Latitud, Longitud]

---

## 🔐 Autenticación (Preparada)

Actualmente, el sistema usa `user_id = 1` por defecto. Para futuras implementaciones:

- Implementar JWT o Sessions
- Agregar middleware de autenticación
- Proteger endpoints sensibles

---

## 📖 Más Información

Ver `README.md` y `SETUP.md` para detalles de instalación y configuración.
