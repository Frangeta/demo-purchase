import { useMemo, useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import SummaryCards from './components/SummaryCards';
import {
  calculateSkuRecommendations,
  CLASS_DEFAULTS,
  exportRecommendations,
  parseWorkbook,
} from './utils/stockUtils';

const initialConfig = {
  windowDays: 15,
  horizonDays: 30,
  safetyExtraDays: 0,
  roundingMultiple: 1,
  classThresholds: { ...CLASS_DEFAULTS },
};

function App() {
  const [rawData, setRawData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
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
      { ROJO: 0, AMARILLO: 0, MUERTO: 0, VERDE: 0 },
    );

    const buyRows = results.filter((item) => item.shouldBuy);

    return {
      totalSkus: results.length,
      ...byState,
      suggestedUnits: buyRows.reduce((sum, item) => sum + item.suggestedQty, 0),
      suggestedInvestment: buyRows.reduce((sum, item) => sum + item.purchaseValue, 0),
      riskSoon: results.filter((item) => item.avgDailyConsumption > 0 && item.daysCoverage <= 7).length,
    };
  }, [results]);

  const handleFileLoaded = (buffer, name) => {
    try {
      const parsed = parseWorkbook(buffer);
      const skuClassSeed = parsed.rows.reduce((acc, row) => {
        if (!acc[row.sku]) {
          acc[row.sku] = classBySku[row.sku] ?? row.productClass ?? 'B';
        }
        return acc;
      }, {});

      setRawData(parsed.rows);
      setWarnings(parsed.issues);
      setClassBySku(skuClassSeed);
      setFileName(name);
      setError('');
    } catch (parseError) {
      setRawData([]);
      setClassBySku({});
      setFileName('');
      setWarnings([]);
      setError(parseError.message || 'Archivo inválido');
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Recomendador de compras (demo)</h1>
        <p className="mt-2 text-sm text-slate-600">Carga un Excel y recalcula recomendaciones en tiempo real, sin backend.</p>
        {fileName ? (
          <p className="mt-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            Archivo cargado: {fileName}
          </p>
        ) : null}
      </header>

      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FileUpload onFileLoaded={handleFileLoaded} error={error} />
        </div>
        <div className="lg:col-span-8">
          <ConfigPanel config={config} onConfigChange={setConfig} />
        </div>
      </section>

      <SummaryCards summary={dashboardSummary} />

      {validationWarning ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{validationWarning}</p>
      ) : null}
      {warnings.length > 0 ? (
        <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Se omitieron/ajustaron filas: {warnings.slice(0, 4).join(' · ')}{warnings.length > 4 ? ' ...' : ''}
        </p>
      ) : null}

      <ResultsTable
        results={results}
        classBySku={classBySku}
        onClassChange={(sku, newClass) => setClassBySku((prev) => ({ ...prev, [sku]: newClass }))}
        onExport={() => exportRecommendations(results)}
      />
    </main>
  );
}

export default App;
