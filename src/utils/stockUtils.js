import * as XLSX from 'xlsx';

const REQUIRED_COLUMNS = ['SKU', 'Date', 'Stock'];

export const CLASS_DEFAULTS = {
  A: { minPct: 20, buyPct: 60 },
  B: { minPct: 15, buyPct: 50 },
  C: { minPct: 10, buyPct: 40 },
};

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

function parseDateValue(value) {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    const date = new Date(EXCEL_EPOCH_MS + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed.includes('/') ? trimmed.replace(/\//g, '-') : trimmed;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeStock(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export function parseWorkbook(fileArrayBuffer) {
  const workbook = XLSX.read(fileArrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames?.[0];

  if (!firstSheetName) {
    throw new Error('El archivo no contiene hojas.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: true,
  });

  if (!rows.length) {
    throw new Error('La primera hoja no contiene filas con datos.');
  }

  const headers = Object.keys(rows[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
  }

  const parsedRows = rows
    .map((row, index) => {
      const sku = String(row.SKU ?? '').trim();
      const parsedDate = parseDateValue(row.Date);
      const stock = normalizeStock(row.Stock);

      if (!sku || !parsedDate || stock == null) {
        return { valid: false, row: index + 2 };
      }

      return {
        valid: true,
        sku,
        date: parsedDate,
        dateIso: toISODate(parsedDate),
        stock,
      };
    })
    .filter((item) => item.valid);

  if (!parsedRows.length) {
    throw new Error('No se encontraron filas válidas (SKU, Date, Stock).');
  }

  return parsedRows;
}

function roundToMultiple(value, multiple) {
  if (multiple <= 0) {
    return value;
  }
  return Math.ceil(value / multiple) * multiple;
}

export function calculateSkuRecommendations(data, config, classBySku) {
  const grouped = data.reduce((acc, row) => {
    if (!acc[row.sku]) {
      acc[row.sku] = [];
    }
    acc[row.sku].push(row);
    return acc;
  }, {});

  const results = Object.entries(grouped).map(([sku, rows]) => {
    const sorted = [...rows].sort((a, b) => a.date - b.date);
    const latest = sorted[sorted.length - 1];
    const productClass = classBySku[sku] ?? 'B';
    const classThresholds = config.classThresholds[productClass] ?? CLASS_DEFAULTS.B;

    const intervals = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1].stock;
      const curr = sorted[i].stock;
      intervals.push(Math.max(0, prev - curr));
    }

    const intervalWindow = Math.max(1, Number(config.windowDays) || 7);
    const usedIntervals = intervals.slice(-intervalWindow);
    const consumptionTotal = usedIntervals.reduce((sum, value) => sum + value, 0);
    const daysConsumption = sorted.length >= 2 ? usedIntervals.length : 0;
    const avgDailyConsumption = daysConsumption > 0 ? consumptionTotal / daysConsumption : 0;

    const horizonDays = Math.max(1, Number(config.horizonDays) || 30);
    const horizonDemand = avgDailyConsumption * horizonDays;
    const stockCurrent = latest.stock;

    const safetyDays = Math.max(0, Number(config.safetyExtraDays) || 0);
    const safety = avgDailyConsumption * safetyDays;

    const suggestedRaw = Math.max(0, horizonDemand + safety - stockCurrent);
    const roundingMultiple = Math.max(1, Number(config.roundingMultiple) || 1);
    const suggestedQty = roundToMultiple(suggestedRaw, roundingMultiple);

    let coverageRatio;
    if (horizonDemand > 0) {
      coverageRatio = stockCurrent / horizonDemand;
    } else {
      coverageRatio = Number.POSITIVE_INFINITY;
    }

    const minThreshold = (classThresholds.minPct ?? 15) / 100;
    const buyThreshold = (classThresholds.buyPct ?? 50) / 100;

    let state = 'VERDE';
    let reason = 'Cobertura suficiente';

    if (stockCurrent === 0 && horizonDemand === 0) {
      state = 'ROJO';
      reason = 'Stock=0 y sin consumo';
    } else if (stockCurrent === 0) {
      state = 'ROJO';
      reason = 'Stock=0';
    } else if (horizonDemand === 0) {
      state = 'VERDE';
      reason = 'Sin consumo reciente';
    } else if (coverageRatio <= minThreshold) {
      state = 'ROJO';
      reason = `Cobertura <= mínimo (${classThresholds.minPct}%)`;
    } else if (coverageRatio <= buyThreshold) {
      state = 'AMARILLO';
      reason = `Cobertura <= compra (${classThresholds.buyPct}%)`;
    }

    return {
      sku,
      productClass,
      latestDate: latest.dateIso,
      stockCurrent,
      avgDailyConsumption,
      horizonDemand,
      coverageRatio,
      coveragePct: Number.isFinite(coverageRatio) ? coverageRatio * 100 : 99900,
      state,
      reason,
      suggestedQty,
    };
  });

  const priority = { ROJO: 0, AMARILLO: 1, VERDE: 2 };

  return results.sort((a, b) => {
    const stateCompare = priority[a.state] - priority[b.state];
    if (stateCompare !== 0) {
      return stateCompare;
    }
    return a.coveragePct - b.coveragePct;
  });
}

export function exportRecommendations(results) {
  const rows = results.map((item) => ({
    SKU: item.sku,
    Clase: item.productClass,
    UltimaFecha: item.latestDate,
    StockActual: item.stockCurrent,
    ConsumoMedioDiario: item.avgDailyConsumption,
    DemandaHorizonte: item.horizonDemand,
    CoberturaPct: Number.isFinite(item.coverageRatio) ? item.coverageRatio * 100 : null,
    Estado: item.state,
    Motivo: item.reason,
    CantidadSugerida: item.suggestedQty,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recomendaciones');
  XLSX.writeFile(workbook, 'recomendaciones_compra.xlsx');
}
