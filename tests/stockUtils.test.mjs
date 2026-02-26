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
  return STOCK_SERIES.map(([dateIso, stock]) => ({
    sku: 'SKU_B',
    date: new Date(`${dateIso}T00:00:00.000Z`),
    dateIso,
    stock,
    productClass: 'B',
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

test('calcula consumo medio últimos 7 días usando variaciones de 08→09 a 14→15', () => {
  const recommendation = getRecommendation(7);

  assert.equal(recommendation.avgDailyConsumption, 11 / 7);
});

test('parseWorkbook requiere Categoria y normaliza clase de producto', () => {
  const worksheet = XLSX.utils.json_to_sheet([
    { SKU: 'SKU_A', Date: '2026-02-01', Stock: 20, Categoria: 'a' },
    { SKU: 'SKU_X', Date: '2026-02-02', Stock: 10, Categoria: 'X' },
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  const parsed = parseWorkbook(buffer);

  assert.equal(parsed[0].productClass, 'A');
  assert.equal(parsed[1].productClass, 'B');
});

test('solo propone compra cuando la cobertura está bajo BUY%', () => {
  const data = [
    { sku: 'SKU_OK', date: new Date('2026-02-01T00:00:00.000Z'), dateIso: '2026-02-01', stock: 100, productClass: 'B' },
    { sku: 'SKU_OK', date: new Date('2026-02-02T00:00:00.000Z'), dateIso: '2026-02-02', stock: 95, productClass: 'B' },
    { sku: 'SKU_LOW', date: new Date('2026-02-01T00:00:00.000Z'), dateIso: '2026-02-01', stock: 100, productClass: 'B' },
    { sku: 'SKU_LOW', date: new Date('2026-02-02T00:00:00.000Z'), dateIso: '2026-02-02', stock: 1, productClass: 'B' },
  ];

  const recommendations = calculateSkuRecommendations(
    data,
    {
      windowDays: 7,
      horizonDays: 30,
      safetyExtraDays: 0,
      roundingMultiple: 1,
      classThresholds: { ...CLASS_DEFAULTS },
    },
    { SKU_OK: 'B', SKU_LOW: 'B' },
  );

  const ok = recommendations.find((item) => item.sku === 'SKU_OK');
  const low = recommendations.find((item) => item.sku === 'SKU_LOW');

  assert.equal(ok.shouldBuy, false);
  assert.equal(ok.suggestedQty, 0);
  assert.equal(low.shouldBuy, true);
  assert.ok(low.suggestedQty > 0);
});
