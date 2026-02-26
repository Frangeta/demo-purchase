import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSkuRecommendations, CLASS_DEFAULTS } from '../src/utils/stockUtils.js';

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
