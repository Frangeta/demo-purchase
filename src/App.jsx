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
  const [isDark, setIsDark] = useState(false);

  const validationWarning = useMemo(() => {
    return ['A', 'B', 'C']
      .filter((className) => config.classThresholds[className].buyPct <= config.classThresholds[className].minPct)
      .map((className) => `Clase ${className}: BUY% debe ser mayor que MIN%`)
      .join(' · ');
  }, [config.classThresholds]);

  const results = useMemo(() => {
    if (!rawData.length) {
      return [];
    }
    return calculateSkuRecommendations(rawData, config, classBySku);
  }, [rawData, config, classBySku]);

  const handleFileLoaded = (buffer, name) => {
    try {
      const parsed = parseWorkbook(buffer);
      setRawData(parsed);
      setFileName(name);
      setError('');

      const skuClassSeed = parsed.reduce((acc, row) => {
        if (!acc[row.sku]) {
          acc[row.sku] = 'B';
        }
        return acc;
      }, {});
      setClassBySku(skuClassSeed);
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
    <div className={isDark ? 'dark' : ''}>
      <main className="min-h-screen bg-background-light px-4 py-8 text-slate-900 transition-colors duration-200 dark:bg-background-dark dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Purchase Recommendations Dashboard</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Streamline your inventory replenishment with data-driven insights.
              </p>
              {fileName ? (
                <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Archivo cargado: {fileName}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="rounded-full p-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
              aria-label="Cambiar tema"
            >
              <span className="material-icons-outlined block dark:hidden">dark_mode</span>
              <span className="material-icons-outlined hidden text-yellow-400 dark:block">light_mode</span>
            </button>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <FileUpload onFileLoaded={handleFileLoaded} error={error} />
            </div>
            <div className="lg:col-span-8">
              <ConfigPanel config={config} onConfigChange={setConfig} />
            </div>
          </section>

          {validationWarning ? (
            <div className="mb-6 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              {validationWarning}
            </div>
          ) : null}

          <ResultsTable
            results={results}
            classBySku={classBySku}
            onClassChange={handleClassChange}
            onExport={() => exportRecommendations(results)}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
