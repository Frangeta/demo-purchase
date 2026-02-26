# Demo web: recomendador de compras (React + Vite)

Demo 100% client-side (sin backend) para cargar un Excel, estimar consumo, detectar riesgo de rotura y proponer compras por SKU.

## Requisitos de entrada (Excel, 1 hoja)

Columnas obligatorias:

- `SKU`
- `Date` (Excel date o `YYYY-MM-DD`)
- `Stock` (>= 0)
- `PVP` (>= 0)

Columna opcional:

- `Categoria` (`A` / `B` / `C`, default `B`)

## Incluye

- Configuración en vivo: N, H, días extra, redondeo, umbrales A/B/C.
- Métricas: cobertura %, días de cobertura, riesgo de rotura, PVP, € compra.
- Estado de SKU: `ROJO`, `AMARILLO`, `VERDE`, `MUERTO`.
- Sparkline de tendencia por SKU (últimos 15 puntos).
- Tarjetas ejecutivas (conteos, inversión y riesgo próximo).
- Exportación XLSX.

## Desarrollo local

```bash
npm install
npm run dev
```

## Otros scripts

```bash
npm test
npm run build
npm run preview
```
