import { useMemo, useState } from 'react';

const STATE_STYLES = {
  ROJO: 'bg-red-100 text-red-700',
  AMARILLO: 'bg-amber-100 text-amber-700',
  VERDE: 'bg-emerald-100 text-emerald-700',
};

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
}

function ResultsTable({ results, classBySku, onClassChange, onExport }) {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('TODOS');

  const filteredRows = useMemo(
    () => results.filter((item) => {
      const matchesSearch = item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesState = stateFilter === 'TODOS' || item.state === stateFilter;
      return matchesSearch && matchesState;
    }),
    [results, search, stateFilter],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">3) Resultados</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar SKU"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="TODOS">Todos</option>
            <option value="ROJO">Rojo</option>
            <option value="AMARILLO">Amarillo</option>
            <option value="VERDE">Verde</option>
          </select>
          <button
            type="button"
            onClick={onExport}
            disabled={!results.length}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Exportar
          </button>
        </div>
      </div>

      {!filteredRows.length ? (
        <p className="p-8 text-center text-sm text-slate-500">Sin datos para mostrar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['SKU', 'Clase', 'Última fecha', 'Stock', 'Consumo diario', 'Demanda H', 'Cobertura %', 'MIN %', 'BUY %', 'Compra', 'Estado', 'Motivo', 'Sugerido'].map((head) => (
                  <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.map((item) => (
                <tr key={item.sku}>
                  <td className="px-4 py-3 font-medium">{item.sku}</td>
                  <td className="px-4 py-3">
                    <select
                      value={classBySku[item.sku] ?? 'B'}
                      onChange={(event) => onClassChange(item.sku, event.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">{item.latestDate}</td>
                  <td className="px-4 py-3">{formatNumber(item.stockCurrent)}</td>
                  <td className="px-4 py-3">{formatNumber(item.avgDailyConsumption)}</td>
                  <td className="px-4 py-3">{formatNumber(item.horizonDemand)}</td>
                  <td className="px-4 py-3">{Number.isFinite(item.coverageRatio) ? `${formatNumber(item.coveragePct)}%` : '∞'}</td>
                  <td className="px-4 py-3">{formatNumber(item.minThresholdPct)}%</td>
                  <td className="px-4 py-3">{formatNumber(item.buyThresholdPct)}%</td>
                  <td className="px-4 py-3">{item.shouldBuy ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATE_STYLES[item.state]}`}>{item.state}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{item.reason}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-700">{formatNumber(item.suggestedQty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ResultsTable;
