import { useMemo, useState } from 'react';

const STATE_STYLES = {
  ROJO: 'bg-red-100 text-red-700',
  AMARILLO: 'bg-amber-100 text-amber-700',
  VERDE: 'bg-emerald-100 text-emerald-700',
};

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
}

function formatPct(coverageRatio) {
  if (!Number.isFinite(coverageRatio)) {
    return '∞';
  }
  return `${(coverageRatio * 100).toFixed(1)}%`;
}

function ResultsTable({
  results,
  classBySku,
  onClassChange,
  onExport,
}) {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('TODOS');

  const filteredRows = useMemo(() => {
    return results.filter((item) => {
      const matchesSearch = item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesState = stateFilter === 'TODOS' || item.state === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [results, search, stateFilter]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">Resultados y recomendaciones</h2>
        <button
          type="button"
          onClick={onExport}
          disabled={!results.length}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Exportar recomendaciones
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-700">
          Buscar SKU
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ej: SKU-001"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-700">
          Filtrar estado
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="TODOS">Todos</option>
            <option value="ROJO">Rojo</option>
            <option value="AMARILLO">Amarillo</option>
            <option value="VERDE">Verde</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Clase</th>
              <th className="px-3 py-2">Última fecha</th>
              <th className="px-3 py-2">Stock actual</th>
              <th className="px-3 py-2">Consumo medio diario</th>
              <th className="px-3 py-2">Demanda H</th>
              <th className="px-3 py-2">Cobertura %</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Motivo</th>
              <th className="px-3 py-2">Cantidad sugerida</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((item) => (
              <tr key={item.sku} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{item.sku}</td>
                <td className="px-3 py-2">
                  <select
                    value={classBySku[item.sku] ?? 'B'}
                    onChange={(event) => onClassChange(item.sku, event.target.value)}
                    className="rounded border border-slate-300 px-2 py-1"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </td>
                <td className="px-3 py-2">{item.latestDate}</td>
                <td className="px-3 py-2">{formatNumber(item.stockCurrent)}</td>
                <td className="px-3 py-2">{formatNumber(item.avgDailyConsumption)}</td>
                <td className="px-3 py-2">{formatNumber(item.horizonDemand)}</td>
                <td className="px-3 py-2">{formatPct(item.coverageRatio)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATE_STYLES[item.state]}`}>
                    {item.state}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-700">{item.reason}</td>
                <td className="px-3 py-2 font-semibold text-slate-900">{formatNumber(item.suggestedQty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filteredRows.length ? (
        <p className="mt-3 text-sm text-slate-500">No hay SKUs para mostrar con los filtros actuales.</p>
      ) : null}
    </div>
  );
}

export default ResultsTable;
