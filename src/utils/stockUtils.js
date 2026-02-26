import * as XLSX from 'xlsx';

const REQUIRED_COLUMNS = ['SKU', 'Date', 'Stock'];

export const CLASS_DEFAULTS = {
  A: { minPct: 20, buyPct: 60 },
  B: { minPct: 15, buyPct: 50 },
  C: { minPct: 10, buyPct: 40 },
};

function parseDateValue(value) {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (!excelDate) {
      return null;
    }

    return new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\//g, '-');
    if (!normalized) {
      return null;
    }

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
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

function sanitizeConfig(config) {
  const windowDays = Math.max(1, Number(config.windowDays) || 7);
  const horizonDays = Math.max(1, Number(config.horizonDays) || 30);
  const safetyExtraDays = Math.max(0, Number(config.safetyExtraDays) || 0);
  const roundingMultiple = Math.max(1, Number(config.roundingMultiple) || 1);

  const classThresholds = ['A', 'B', 'C'].reduce((acc, className) => {
    const source = config.classThresholds[className] ?? CLASS_DEFAULTS[className];
    const minPct = Math.max(0, Number(source.minPct) || 0);
    const buyPct = Math.max(minPct + 1, Number(source.buyPct) || CLASS_DEFAULTS[className].buyPct);

    return {
      ...acc,
      [className]: { minPct, buyPct },
    };
  }, {});

  return { windowDays, horizonDays, safetyExtraDays, roundingMultiple, classThresholds };
}

export function parseWorkbook(fileArrayBuffer) {
  const workbook = XLSX.read(fileArrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames?.[0];

  if (!firstSheetName) {
    throw new Error('El archivo no contiene hojas.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });

  if (!rows.length) {
    throw new Error('La primera hoja no contiene filas con datos.');
  }

  const headers = Object.keys(rows[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
  }

  const parsedRows = rows
    .map((row) => {
      const sku = String(row.SKU ?? '').trim();
      const parsedDate = parseDateValue(row.Date);
      const stock = normalizeStock(row.Stock);

      if (!sku || !parsedDate || stock == null) {
        return null;
      }

      return { sku, date: parsedDate, dateIso: toISODate(parsedDate), stock };
    })
    .filter(Boolean);

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
  const safeConfig = sanitizeConfig(config);

  const grouped = data.reduce((acc, row) => {
    if (!acc[row.sku]) {
      acc[row.sku] = [];
    }
    acc[row.sku].push(row);
    return acc;
  }, {});

  const results = Object.entries(grouped).map(([sku, rows]) => {
    const byDate = new Map();
    rows.forEach((row) => {
      byDate.set(row.dateIso, row);
    });

    const sorted = [...byDate.values()].sort((a, b) => a.date - b.date);
    const latest = sorted[sorted.length - 1];
    const productClass = classBySku[sku] ?? 'B';
    const thresholds = safeConfig.classThresholds[productClass] ?? safeConfig.classThresholds.B;

    const intervals = [];
    for (let index = 1; index < sorted.length; index += 1) {
      const prev = sorted[index - 1].stock;
      const curr = sorted[index].stock;
      intervals.push(Math.max(0, prev - curr));
    }

    const usedIntervals = intervals.slice(-safeConfig.windowDays);
    const totalConsumption = usedIntervals.reduce((sum, value) => sum + value, 0);
    const avgDailyConsumption = usedIntervals.length ? totalConsumption / usedIntervals.length : 0;

    const horizonDemand = avgDailyConsumption * safeConfig.horizonDays;
    const safetyDemand = avgDailyConsumption * safeConfig.safetyExtraDays;
    const stockCurrent = latest.stock;

    const suggestedRaw = Math.max(0, horizonDemand + safetyDemand - stockCurrent);
    const suggestedQty = roundToMultiple(suggestedRaw, safeConfig.roundingMultiple);

    const coverageRatio = horizonDemand > 0 ? stockCurrent / horizonDemand : Number.POSITIVE_INFINITY;

    const minThreshold = thresholds.minPct / 100;
    const buyThreshold = thresholds.buyPct / 100;

    let state = 'VERDE';
    let reason = 'Cobertura suficiente';

    if (stockCurrent === 0 && horizonDemand === 0) {
      state = 'ROJO';
      reason = 'Stock=0 y sin consumo reciente';
    } else if (stockCurrent === 0) {
      state = 'ROJO';
      reason = 'Stock=0';
    } else if (horizonDemand === 0) {
      state = 'VERDE';
      reason = 'Sin consumo reciente';
    } else if (coverageRatio <= minThreshold) {
      state = 'ROJO';
      reason = `Cobertura <= mínimo (${thresholds.minPct}%)`;
    } else if (coverageRatio <= buyThreshold) {
      state = 'AMARILLO';
      reason = `Cobertura <= compra (${thresholds.buyPct}%)`;
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
