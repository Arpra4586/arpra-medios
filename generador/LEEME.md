# Generador de historias y reels — Distribuidores Arpra

Genera cada semana 14 historias (2 por día) y 3 reels con los precios del catálogo publicado
(Vitrina iPhone Arpra) y deja un `plan.json` para programarlos en Metricool.

```
cd generador && npm install
node generar.js /ruta/catalogo.html 2026-10-28 ../semanas/2026-10-28
```

Requiere `ffmpeg`. Las imágenes se sirven desde
`https://raw.githubusercontent.com/Arpra4586/arpra-medios/main/<ruta>`.

## Fotos reales

Pon fotos reales en la carpeta `fotos/` de este repositorio, una por modelo, con el nombre del modelo:
`iphone-13.jpg`, `iphone-13-pro.jpg`, `iphone-14-pro-max.jpg`, `iphone-16.jpg`, `iphone-se-3.jpg`...
La misma foto se usa para todas las capacidades y grados de ese modelo. Los modelos sin foto siguen con la ilustración.
También sirven las fotos subidas desde el panel del catálogo ("Usar foto real" y luego "Publicar cambios").
