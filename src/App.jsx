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
    <main className="mx-auto min-h-screen max-w-7xl space-y-5 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Demo de recomendaciones de compra</h1>
        <p className="text-sm text-slate-600">
          Carga un Excel con stock diario por SKU, estima consumo, cobertura y sugiere compra.
        </p>
        {fileName ? (
          <p className="mt-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            Archivo cargado: {fileName}
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <FileUpload onFileLoaded={handleFileLoaded} error={error} />
        <ConfigPanel config={config} onConfigChange={setConfig} />
      </section>

      {validationWarning ? (
        <div className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-700">{validationWarning}</div>
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

export default App;
