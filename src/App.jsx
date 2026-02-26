import { useMemo, useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import {
  calculateSkuRecommendations,
  CLASS_DEFAULTS,
  exportRecommendations,
  parseWorkbook,
} from './utils/stockUtils';

const initialConfig = {
  windowDays: 7,
  horizonDays: 30,
  safetyExtraDays: 0,
  roundingMultiple: 1,
  classThresholds: { ...CLASS_DEFAULTS },
};

function App() {
  const [rawData, setRawData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState(initialConfig);
  const [classBySku, setClassBySku] = useState({});

  const validationWarning = useMemo(
    () => ['A', 'B', 'C']
      .filter((className) => config.classThresholds[className].buyPct <= config.classThresholds[className].minPct)
      .map((className) => `Clase ${className}: BUY% debe ser mayor que MIN%`)
      .join(' · '),
    [config.classThresholds],
  );

  const results = useMemo(() => {
    if (!rawData.length) {
      return [];
    }

    return calculateSkuRecommendations(rawData, config, classBySku);
  }, [rawData, config, classBySku]);

  const dashboardSummary = useMemo(() => {
    const byState = results.reduce(
      (acc, item) => ({ ...acc, [item.state]: acc[item.state] + 1 }),
      { ROJO: 0, AMARILLO: 0, VERDE: 0 },
    );

    const totalSuggested = results.reduce((sum, item) => sum + item.suggestedQty, 0);

    return {
      totalSkus: results.length,
      ...byState,
      totalSuggested,
    };
  }, [results]);

  const handleFileLoaded = (buffer, name) => {
    try {
      const parsed = parseWorkbook(buffer);
      const skuClassSeed = parsed.reduce((acc, row) => {
        if (!acc[row.sku]) {
          acc[row.sku] = classBySku[row.sku] ?? row.productClass ?? 'B';
        }
        return acc;
      }, {});

      setRawData(parsed);
      setClassBySku(skuClassSeed);
      setFileName(name);
      setError('');
    } catch (parseError) {
      setRawData([]);
      setClassBySku({});
      setFileName('');
      setError(parseError.message || 'Archivo inválido');
    }
  };

  const handleClassChange = (sku, newClass) => {
    setClassBySku((prev) => ({ ...prev, [sku]: newClass }));
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Recomendaciones de compra</h1>
        <p className="mt-2 text-sm text-slate-600">
          Auditoría de stock por SKU con sugerencias de compra, optimizada para ejecución estática en GitHub Pages.
        </p>
        {fileName ? (
          <p className="mt-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            Archivo cargado: {fileName}
          </p>
        ) : null}
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5">
        <SummaryCard label="SKU evaluados" value={dashboardSummary.totalSkus} />
        <SummaryCard label="Rojos" value={dashboardSummary.ROJO} tone="red" />
        <SummaryCard label="Amarillos" value={dashboardSummary.AMARILLO} tone="yellow" />
        <SummaryCard label="Verdes" value={dashboardSummary.VERDE} tone="green" />
        <SummaryCard label="Compra sugerida" value={dashboardSummary.totalSuggested} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FileUpload onFileLoaded={handleFileLoaded} error={error} />
        </div>
        <div className="lg:col-span-8">
          <ConfigPanel config={config} onConfigChange={setConfig} />
        </div>
      </section>

      {validationWarning ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {validationWarning}
        </p>
      ) : null}

      <ResultsTable
        results={results}
        classBySku={classBySku}
        onClassChange={handleClassChange}
        onExport={() => exportRecommendations(results)}
      />
    </main>
  );
}

function SummaryCard({ label, value, tone = 'slate' }) {
  const toneClass = {
    slate: 'text-slate-700',
    red: 'text-red-700',
    yellow: 'text-amber-700',
    green: 'text-emerald-700',
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass[tone]}`}>{formatNumber(value)}</p>
    </article>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
}

export default App;
