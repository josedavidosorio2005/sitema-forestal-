# Guia de usuario - Sistema de Analisis Forestal

Esta guia explica como usar la aplicacion sin entrar en detalles tecnicos.

## Que es la aplicacion

El sistema permite registrar zonas forestales sobre un mapa, guardar especies del inventario y generar reportes de analisis por zona. La informacion queda organizada para consulta, seguimiento y presentacion al cliente.

## Pantallas principales

- **Inicio:** mapa interactivo, dibujo de poligonos y resumen rapido de zonas.
- **Zonas:** listado de zonas registradas, edicion, eliminacion y generacion de reportes.
- **Subzonas:** sectores internos de cada zona para planear plantacion, recoleccion o conservacion.
- **Especies:** catalogo de especies con nombre comun, nombre cientifico, tipo, region e imagen opcional.
- **Reportes:** historial de analisis con area, cobertura vegetal, densidad forestal y especies probables.

## Como registrar una zona

1. Abre la pantalla **Inicio**.
2. Usa la herramienta de dibujo del mapa para crear un poligono.
3. Escribe el nombre de la zona y, si aplica, la region o descripcion.
4. Guarda la zona.
5. La zona aparecera en el mapa y en el listado de **Zonas**.

## Como crear el catalogo de especies

1. Entra a **Especies**.
2. Presiona **Nueva especie**.
3. Completa nombre comun, nombre cientifico y tipo.
4. Agrega region, descripcion, imagen u observaciones si las tienes.
5. Guarda la especie.

## Como crear subzonas dentro de una zona

1. Selecciona una zona existente desde el mapa o desde **Zonas**.
2. En el mapa, presiona **Dibujar subzona** si quieres marcar un poligono interno.
3. Completa los datos operativos:
   - Uso: plantacion, recoleccion, conservacion o mixto.
   - Operacion: sembrar, recolectar o monitorear.
   - Inclinacion del terreno en grados.
   - Tipo de suelo.
   - Arbol a sembrar o recolectar.
   - Cantidad de arboles en esa subzona.
4. Guarda la subzona.

Tambien puedes crear una subzona desde **Zonas** sin poligono, util para planificacion rapida.

## Como generar y consultar reportes

1. Crea o selecciona una zona existente.
2. Genera el reporte desde la zona.
3. Revisa el resultado en **Reportes**.
4. Usa **Imprimir reporte** para entregar una version simple al cliente.

## Consejos de uso

- Dibuja poligonos cerrados y evita puntos duplicados.
- Usa nombres de zona claros, por ejemplo "Reserva norte" o "Lote 3".
- Manten el campo de region consistente para mejorar la coincidencia de especies probables.
- Registra especies antes de generar reportes si quieres recomendaciones mas utiles.

## Soporte

Si la aplicacion no carga datos, verifica primero que el backend este encendido y que el frontend tenga configurado `REACT_APP_API_URL`.
