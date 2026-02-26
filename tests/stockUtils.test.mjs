import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { calculateSkuRecommendations, CLASS_DEFAULTS, parseWorkbook } from '../src/utils/stockUtils.js';

const STOCK_SERIES = [
  ['2026-02-01', 94],
  ['2026-02-02', 102],
  ['2026-02-03', 110],
  ['2026-02-04', 116],
  ['2026-02-05', 111],
  ['2026-02-06', 104],
  ['2026-02-07', 106],
  ['2026-02-08', 98],
  ['2026-02-09', 98],
  ['2026-02-10', 103],
  ['2026-02-11', 106],
  ['2026-02-12', 105],
  ['2026-02-13', 102],
  ['2026-02-14', 99],
  ['2026-02-15', 95],
];

function buildRows() {
  return STOCK_SERIES.map(([dateIso, stock], idx) => ({
    sku: 'SKU_B',
    date: new Date(`${dateIso}T00:00:00.000Z`),
    dateIso,
    stock,
    productClass: 'B',
    pvp: idx < 10 ? null : 5,
  }));
}

function getRecommendation(windowDays) {
  const [recommendation] = calculateSkuRecommendations(
    buildRows(),
    {
      windowDays,
      horizonDays: 30,
      safetyExtraDays: 0,
      roundingMultiple: 1,
      classThresholds: { ...CLASS_DEFAULTS },
    },
    { SKU_B: 'B' },
  );

  return recommendation;
}

test('calcula consumo medio en 15 días usando solo bajadas y 14 intervalos', () => {
  const recommendation = getRecommendation(15);

  assert.equal(recommendation.stockCurrent, 95);
  assert.equal(recommendation.avgDailyConsumption, 31 / 14);
});

test('parseWorkbook requiere PVP y normaliza clase de producto', () => {
  const worksheet = XLSX.utils.json_to_sheet([
    { SKU: 'SKU_A', Date: '2026-02-01', Stock: 20, Categoria: 'a', PVP: 10 },
    { SKU: 'SKU_X', Date: '2026-02-02', Stock: 10, Categoria: 'X', PVP: '' },
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  const parsed = parseWorkbook(buffer);

  assert.equal(parsed.rows[0].productClass, 'A');
  assert.equal(parsed.rows[1].productClass, 'B');
});

test('calcula días cobertura, riesgo de rotura y valor de compra', () => {
  const recommendations = calculateSkuRecommendations(
    [
      { sku: 'SKU_1', date: new Date('2026-02-01T00:00:00.000Z'), dateIso: '2026-02-01', stock: 20, productClass: 'B', pvp: 2 },
      { sku: 'SKU_1', date: new Date('2026-02-02T00:00:00.000Z'), dateIso: '2026-02-02', stock: 10, productClass: 'B', pvp: null },
      { sku: 'SKU_1', date: new Date('2026-02-03T00:00:00.000Z'), dateIso: '2026-02-03', stock: 5, productClass: 'B', pvp: 3 },
    ],
    {
      windowDays: 10,
      horizonDays: 30,
      safetyExtraDays: 0,
      roundingMultiple: 1,
      classThresholds: { ...CLASS_DEFAULTS },
    },
    { SKU_1: 'B' },
  );

  const item = recommendations[0];
  assert.equal(item.daysCoverage, 5 / 7.5);
  assert.equal(item.stockoutRisk, '2026-02-03');
  assert.equal(item.pvpUnit, 3);
  assert.ok(item.purchaseValue > 0);
});

test('marca estado MUERTO cuando hay baja rotación con stock positivo', () => {
  const recommendations = calculateSkuRecommendations(
    [
      { sku: 'SKU_DEAD', date: new Date('2026-02-01T00:00:00.000Z'), dateIso: '2026-02-01', stock: 100, productClass: 'B', pvp: 1 },
      { sku: 'SKU_DEAD', date: new Date('2026-02-02T00:00:00.000Z'), dateIso: '2026-02-02', stock: 100, productClass: 'B', pvp: 1 },
    ],
    {
      windowDays: 10,
      horizonDays: 30,
      safetyExtraDays: 0,
      roundingMultiple: 1,
      classThresholds: { ...CLASS_DEFAULTS },
    },
    { SKU_DEAD: 'B' },
  );

  assert.equal(recommendations[0].state, 'MUERTO');
});
