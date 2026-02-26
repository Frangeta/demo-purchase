# Demo web: recomendaciones de compra (React + Vite)

Aplicación client-side para cargar stock diario por SKU y generar recomendaciones de compra.

## Objetivo del refactor

Se rediseñó la app para:

- funcionar de forma robusta en **GitHub Pages**,
- reducir complejidad visual y técnica,
- mejorar validaciones y saneamiento de configuración,
- dejar un flujo de deploy predecible y fácil de mantener.

## Stack

- React 18 + Vite 5
- Tailwind CSS
- `xlsx` para lectura y exportación Excel

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
npm run check:pages-build
npm run preview
```

## Publicación en GitHub Pages

Este repo incluye workflow en `.github/workflows/deploy-pages.yml` con el pipeline oficial de Pages:

1. build en GitHub Actions,
2. validación de `dist/index.html`,
3. upload artifact,
4. deploy con `actions/deploy-pages`.

### Configuración requerida en GitHub

En **Settings → Pages**, seleccionar **Source: GitHub Actions**.

## Base path para Pages

`vite.config.js` calcula `base` así:

- `VITE_BASE_PATH` si existe (útil para pruebas),
- si no, usa `GITHUB_REPOSITORY` y toma `/<repo>/`,
- en dev local siempre `base: '/'`.

Ejemplo opcional local:

```bash
VITE_BASE_PATH=demo-purchase npm run build
```

## Formato de entrada

Primera hoja del Excel con columnas:

- `SKU`
- `Date`
- `Stock`

Se descartan filas inválidas y se normaliza por SKU/fecha.

## Lógica de recomendación

Por SKU:

1. consumo por intervalo: `max(0, stock_prev - stock_actual)`,
2. promedio en ventana de últimos `N` intervalos,
3. demanda horizonte: `promedio * H`,
4. seguridad: `promedio * días_extra`,
5. sugerido: `max(0, demanda + seguridad - stock_actual)`,
6. redondeo por múltiplo,
7. estado por umbrales MIN/BUY de clase A/B/C.

## Scripts

- `npm run dev`: servidor local.
- `npm run build`: build Vite.
- `npm run preview`: preview local de `dist`.
- `npm run check:pages-build`: valida que `dist/index.html` no apunte a `src/*`.
