import * as XLSX from 'xlsx';

const REQUIRED_COLUMNS = ['SKU', 'Date', 'Stock', 'PVP'];
const DEAD_STOCK_MAX_CONSUMPTION = 0.1;
const DEAD_STOCK_MAX_DAYS = 180;

export const CLASS_DEFAULTS = {
  A: { minPct: 20, buyPct: 60 },
  B: { minPct: 15, buyPct: 50 },
  C: { minPct: 10, buyPct: 40 },
};

function normalizeProductClass(value) {
  if (value == null || value === '') {
    return 'B';
  }

  const normalized = String(value).trim().toUpperCase();
  return ['A', 'B', 'C'].includes(normalized) ? normalized : 'B';
}

function parseDateValue(value) {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (!excelDate) {
      return null;
    }
    return new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
  }

  const normalized = String(value).trim().replace(/\//g, '-');
  const isoLike = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoLike) {
    const year = Number(isoLike[1]);
    const month = Number(isoLike[2]);
    const day = Number(isoLike[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
      return date;
    }
    return null;
  }

  const guess = new Date(normalized);
  if (Number.isNaN(guess.getTime())) {
    return null;
  }
  return new Date(Date.UTC(guess.getFullYear(), guess.getMonth(), guess.getDate()));
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizePositiveNumber(value) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(String(value).replace(',', '.'));
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function sanitizeConfig(config) {
  const windowDays = Math.max(1, Number(config.windowDays) || 15);
  const horizonDays = Math.max(1, Number(config.horizonDays) || 30);
  const safetyExtraDays = Math.max(0, Number(config.safetyExtraDays) || 0);
  const roundingMultiple = Math.max(1, Number(config.roundingMultiple) || 1);

  const classThresholds = ['A', 'B', 'C'].reduce((acc, className) => {
    const source = config.classThresholds[className] ?? CLASS_DEFAULTS[className];
    const minPct = Math.max(0, Number(source.minPct) || 0);
    const buyPct = Math.max(minPct + 1, Number(source.buyPct) || CLASS_DEFAULTS[className].buyPct);
    return { ...acc, [className]: { minPct, buyPct } };
  }, {});

  return { windowDays, horizonDays, safetyExtraDays, roundingMultiple, classThresholds };
}

function roundToMultiple(value, multiple) {
  return Math.ceil(value / multiple) * multiple;
}

function addDays(date, days) {
  const msDay = 24 * 60 * 60 * 1000;
  return new Date(date.getTime() + days * msDay);
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

  const issues = [];
  const parsedRows = rows
    .map((row, index) => {
      const sku = String(row.SKU ?? '').trim();
      const date = parseDateValue(row.Date);
      const stock = normalizePositiveNumber(row.Stock);
      const pvp = normalizePositiveNumber(row.PVP);

      if (!sku || !date || stock == null) {
        issues.push(`Fila ${index + 2}: SKU/Date/Stock inválido`);
        return null;
      }

      if (row.PVP !== '' && pvp == null) {
        issues.push(`Fila ${index + 2}: PVP no numérico`);
      }

      return {
        sku,
        date,
        dateIso: toISODate(date),
        stock,
        productClass: normalizeProductClass(row.Categoria),
        pvp,
      };
    })
    .filter(Boolean);

  if (!parsedRows.length) {
    throw new Error('No se encontraron filas válidas (SKU, Date, Stock).');
  }

  return { rows: parsedRows, issues };
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
    rows.forEach((row) => byDate.set(row.dateIso, row));
    const sorted = [...byDate.values()].sort((a, b) => a.date - b.date);
    const latest = sorted[sorted.length - 1];

    let lastPvp = 0;
    sorted.forEach((row) => {
      if (row.pvp != null) {
        lastPvp = row.pvp;
      }
    });

    const stockSeries = sorted.map((row) => ({ dateIso: row.dateIso, stock: row.stock }));
    const intervals = [];
    for (let index = 1; index < sorted.length; index += 1) {
      const prev = sorted[index - 1].stock;
      const curr = sorted[index].stock;
      intervals.push({
        consumo: Math.max(0, prev - curr),
        entrada: Math.max(0, curr - prev),
      });
    }

    const usedIntervals = intervals.slice(-safeConfig.windowDays);
    const totalConsumption = usedIntervals.reduce((sum, item) => sum + item.consumo, 0);
    const avgDailyConsumption = usedIntervals.length ? totalConsumption / usedIntervals.length : 0;

    const stockCurrent = latest.stock;
    const horizonDemand = avgDailyConsumption * safeConfig.horizonDays;
    const safetyDemand = avgDailyConsumption * safeConfig.safetyExtraDays;

    const coverageRatio = horizonDemand > 0 ? stockCurrent / horizonDemand : Number.POSITIVE_INFINITY;
    const coveragePct = Number.isFinite(coverageRatio) ? coverageRatio * 100 : Number.POSITIVE_INFINITY;

    let daysCoverage;
    if (avgDailyConsumption > 0) {
      daysCoverage = stockCurrent / avgDailyConsumption;
    } else if (stockCurrent === 0) {
      daysCoverage = 0;
    } else {
      daysCoverage = Number.POSITIVE_INFINITY;
    }

    let stockoutRisk = 'Sin rotura (sin consumo)';
    if (avgDailyConsumption > 0) {
      stockoutRisk = toISODate(addDays(latest.date, Math.floor(daysCoverage)));
    } else if (stockCurrent === 0) {
      stockoutRisk = 'Hoy';
    }

    const productClass = classBySku[sku] ?? sorted[sorted.length - 1].productClass ?? 'B';
    const thresholds = safeConfig.classThresholds[productClass] ?? safeConfig.classThresholds.B;
    const minThreshold = thresholds.minPct / 100;
    const buyThreshold = thresholds.buyPct / 100;

    const isDeadStock = stockCurrent > 0 && (avgDailyConsumption <= DEAD_STOCK_MAX_CONSUMPTION || daysCoverage > DEAD_STOCK_MAX_DAYS);

    let state = 'VERDE';
    let reason = 'Cobertura suficiente';

    if (stockCurrent === 0 || coverageRatio <= minThreshold) {
      state = 'ROJO';
      reason = stockCurrent === 0 ? 'Stock=0' : `Cobertura <= mínimo (${thresholds.minPct}%)`;
    } else if (coverageRatio <= buyThreshold) {
      state = 'AMARILLO';
      reason = `Cobertura <= compra (${thresholds.buyPct}%)`;
    }

    if (state !== 'ROJO' && isDeadStock) {
      state = 'MUERTO';
      reason = 'Stock muerto (baja rotación)';
    }

    const shouldBuy = state === 'ROJO' || state === 'AMARILLO';
    const suggestedRaw = shouldBuy ? Math.max(0, horizonDemand + safetyDemand - stockCurrent) : 0;
    const suggestedQty = suggestedRaw > 0 ? roundToMultiple(suggestedRaw, safeConfig.roundingMultiple) : 0;
    const purchaseValue = suggestedQty * lastPvp;

    return {
      sku,
      productClass,
      latestDate: latest.dateIso,
      stockCurrent,
      stockSeries,
      avgDailyConsumption,
      horizonDemand,
      coverageRatio,
      coveragePct,
      daysCoverage,
      stockoutRisk,
      minThresholdPct: thresholds.minPct,
      buyThresholdPct: thresholds.buyPct,
      pvpUnit: lastPvp,
      shouldBuy,
      suggestedQty,
      purchaseValue,
      state,
      reason,
    };
  });

  const priority = { ROJO: 0, AMARILLO: 1, MUERTO: 2, VERDE: 3 };
  return results.sort((a, b) => {
    const stateCompare = priority[a.state] - priority[b.state];
    if (stateCompare !== 0) {
      return stateCompare;
    }
    const coverageCompare = (Number.isFinite(a.daysCoverage) ? a.daysCoverage : 999999) - (Number.isFinite(b.daysCoverage) ? b.daysCoverage : 999999);
    if (coverageCompare !== 0) {
      return coverageCompare;
    }
    return b.avgDailyConsumption - a.avgDailyConsumption;
  });
}

export function exportRecommendations(results) {
  const rows = results.map((item) => ({
    SKU: item.sku,
    Clase: item.productClass,
    UltimaFecha: item.latestDate,
    Stock: item.stockCurrent,
    ConsumoDiario: item.avgDailyConsumption,
    DemandaH: item.horizonDemand,
    CoberturaPct: Number.isFinite(item.coveragePct) ? item.coveragePct : '∞',
    DiasCobertura: Number.isFinite(item.daysCoverage) ? item.daysCoverage : '∞',
    RiesgoRotura: item.stockoutRisk,
    PVP: item.pvpUnit,
    CantidadSugerida: item.suggestedQty,
    EuroCompra: item.purchaseValue,
    Estado: item.state,
    Motivo: item.reason,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recomendaciones');
  XLSX.writeFile(workbook, 'recomendaciones_compra.xlsx');
}
