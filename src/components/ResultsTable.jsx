import { useMemo, useState } from 'react';

const STATE_STYLES = {
  ROJO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  AMARILLO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VERDE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const STATE_LABELS = {
  ROJO: 'BUY',
  AMARILLO: 'WARNING',
  VERDE: 'OK',
};

const CLASS_STYLES = {
  A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
}

function coverageDisplay(coverageRatio) {
  if (!Number.isFinite(coverageRatio)) {
    return { label: '>100%', width: 100 };
  }

  const pct = Math.max(0, coverageRatio * 100);
  return {
    label: `${pct.toFixed(0)}%`,
    width: Math.min(100, pct),
  };
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 dark:border-slate-700 md:flex-row md:items-center">
        <div className="flex-grow">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="material-icons-outlined text-primary">analytics</span>
            Results and Recommendations
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px]">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <span className="material-icons-outlined text-sm">search</span>
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search SKU..."
              className="w-full rounded-lg border-slate-300 py-2 pl-10 text-sm focus:border-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-900"
            />
          </div>
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="rounded-lg border-slate-300 text-sm focus:border-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="TODOS">All Statuses</option>
            <option value="ROJO">Critical (Buy)</option>
            <option value="AMARILLO">Warning</option>
            <option value="VERDE">Healthy</option>
          </select>
          <button
            type="button"
            onClick={onExport}
            disabled={!results.length}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <span className="material-icons-outlined text-sm">download</span>
            Export Recommendations
          </button>
        </div>
      </div>

      <div className="custom-scrollbar overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50">
              {['SKU', 'Class', 'Last Date', 'Stock', 'Avg Daily Cons.', 'Demand (H)', 'Coverage %', 'Status', 'Reason', 'Suggested'].map((head) => (
                <th key={head} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredRows.map((item) => {
              const coverage = coverageDisplay(item.coverageRatio);
              return (
                <tr key={item.sku} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/20">
                  <td className="px-6 py-4 text-sm font-medium">{item.sku}</td>
                  <td className="px-6 py-4">
                    <select
                      value={classBySku[item.sku] ?? 'B'}
                      onChange={(event) => onClassChange(item.sku, event.target.value)}
                      className={`rounded border px-2 py-0.5 text-[10px] font-bold ${CLASS_STYLES[classBySku[item.sku] ?? 'B']} border-transparent`}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{item.latestDate}</td>
                  <td className="px-6 py-4 text-sm font-medium">{formatNumber(item.stockCurrent)}</td>
                  <td className="px-6 py-4 text-sm">{formatNumber(item.avgDailyConsumption)}</td>
                  <td className="px-6 py-4 text-sm">{formatNumber(item.horizonDemand)}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className={`h-full ${item.state === 'ROJO' ? 'bg-red-500' : item.state === 'AMARILLO' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${coverage.width}%` }} />
                      </div>
                      <span>{coverage.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_STYLES[item.state]}`}>
                      {STATE_LABELS[item.state]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{item.reason}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">{formatNumber(item.suggestedQty)} units</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!filteredRows.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
            <span className="material-icons-outlined text-4xl text-slate-400">inventory_2</span>
          </div>
          <h3 className="text-lg font-medium">No SKU data to display</h3>
          <p className="mt-1 max-w-sm text-slate-500 dark:text-slate-400">
            Upload an Excel file to see purchase recommendations based on your current configuration.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-xs text-slate-500 dark:text-slate-400">Showing 1 to {Math.min(filteredRows.length, 25)} of {filteredRows.length} entries</p>
        <div className="flex gap-2">
          <button type="button" className="rounded border border-slate-300 p-2 transition-colors hover:bg-white dark:border-slate-600 dark:hover:bg-slate-800">
            <span className="material-icons-outlined text-sm">chevron_left</span>
          </button>
          <button type="button" className="rounded border border-slate-300 p-2 transition-colors hover:bg-white dark:border-slate-600 dark:hover:bg-slate-800">
            <span className="material-icons-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsTable;
