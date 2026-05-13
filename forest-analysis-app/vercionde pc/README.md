# Sistema Forestal PC

Version Windows del sistema forestal. Incluye mapa, dibujo de zonas, subzonas, especies, reportes y CRUD en una app de escritorio empaquetable como `.exe`.

Por defecto usa `REACT_APP_STORAGE_MODE=local-first`, asi que guarda los datos en el equipo Windows sin depender del backend. Es la version recomendada para mostrar al cliente como demo instalable/portable.

## Abrir en desarrollo

```bat
run-pc.bat
```

## Generar EXE portable

```bat
build-exe.bat
```

Salida esperada:

```text
dist\Sistema-Forestal-PC-1.0.0-portable.exe
```

## Datos

La app guarda en almacenamiento local de Electron:

- zonas dibujadas
- subzonas con poligono, pendiente, suelo, especie y cantidad de arboles
- catalogo de especies
- reportes generados

## Backend opcional

No hace falta backend para la demo. Si luego quieres que use la API Express, cambia `.env`:

```text
REACT_APP_STORAGE_MODE=api-first
REACT_APP_API_URL=http://localhost:5000/api
```

Despues vuelve a compilar:

```bat
build-exe.bat
```

