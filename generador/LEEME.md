# Generador de historias y reels — Distribuidores Arpra

Genera cada semana 14 historias (2 por día) y 3 reels con los precios del catálogo publicado
(Vitrina iPhone Arpra) y deja un `plan.json` para programarlos en Metricool.

```
cd generador && npm install
node generar.js /ruta/catalogo.html 2026-10-28 ../semanas/2026-10-28
```

Requiere `ffmpeg`. Las imágenes se sirven desde
`https://raw.githubusercontent.com/Arpra4586/arpra-medios/main/<ruta>`.
