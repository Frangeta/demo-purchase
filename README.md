# Demo web: recomendaciones de compra (React + Vite + Tailwind)

Demo 100% client-side para cargar un Excel de stock diario por SKU y calcular recomendaciones de compra.

## Stack

- React + Vite
- Tailwind CSS
- `xlsx` para lectura y exportación XLSX

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abre la URL que indique Vite (normalmente `http://localhost:5173`).


## Publicar en GitHub Pages

Este proyecto ya está preparado para ejecutarse como sitio estático en GitHub Pages:

1. Sube el repo a GitHub.
2. Asegúrate de trabajar sobre la rama `main`.
3. En GitHub, ve a **Settings → Pages** y en **Build and deployment** selecciona **GitHub Actions**.
4. Cada push a `main` ejecutará el workflow `.github/workflows/deploy-pages.yml`.
5. La URL quedará publicada en:
   - `https://<tu-usuario>.github.io/<tu-repo>/`

> Nota: la configuración de Vite usa rutas relativas (`base: './'`) para que el build funcione correctamente en subrutas como las de GitHub Pages.

## Formato del archivo de entrada

Usa un único archivo Excel (primera hoja), con columnas obligatorias:

- `SKU` (texto)
- `Date` (fecha Excel o string YYYY-MM-DD)
- `Stock` (número >= 0)

La app:
- valida columnas y filas,
- ignora filas vacías/ inválidas,
- ordena por SKU y fecha ascendente,
- toma como stock actual el de la última fecha por SKU.

## Lógica de cálculo (por SKU)

1. **Consumo por intervalo**:
   - si `stock(t) < stock(t-1)`: consumo = `stock(t-1) - stock(t)`
   - si `stock(t) > stock(t-1)`: entrada (no suma consumo)
   - si iguales: 0
2. **Consumo medio diario** en ventana de últimos `N` intervalos disponibles.
3. **Demanda horizonte**: `consumo_medio_diario * H`.
4. **Cobertura**:
   - `stock_actual / demanda_horizonte` si demanda > 0
   - infinito si demanda = 0
5. **Cantidad sugerida**:
   - `max(0, demanda_horizonte + seguridad - stock_actual)`
   - seguridad implementada como `+ días extra`.
   - redondeo por múltiplos configurable.
6. **Semáforo** por clase A/B/C:
   - ROJO: `stock_actual = 0` o cobertura <= MIN%
   - AMARILLO: cobertura <= BUY% y > MIN%
   - VERDE: cobertura > BUY% (o sin consumo reciente con stock > 0)

## Parámetros configurables

### Globales

- Ventana de consumo histórico (`N`, default 7)
- Horizonte forecast (`H`, default 30)
- Seguridad por días extra (default 0)
- Redondeo de sugerencia (múltiplos, default 1)

### Por clase (A/B/C)

Defaults:
- A: MIN 20 / BUY 60
- B: MIN 15 / BUY 50
- C: MIN 10 / BUY 40

La clase default para SKU es **B**, editable por fila en la tabla.

## Export

Botón **Exportar recomendaciones** genera archivo `recomendaciones_compra.xlsx` con:

- SKU
- Clase
- UltimaFecha
- StockActual
- ConsumoMedioDiario
- DemandaHorizonte
- CoberturaPct
- Estado
- Motivo
- CantidadSugerida

## Estructura

- `src/components/FileUpload.jsx`
- `src/components/ConfigPanel.jsx`
- `src/components/ResultsTable.jsx`
- `src/utils/stockUtils.js`
- `src/App.jsx`
