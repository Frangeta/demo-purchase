import { useRef } from 'react';

function FileUpload({ onFileLoaded, error }) {
  const inputRef = useRef(null);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const buffer = await file.arrayBuffer();
    onFileLoaded(buffer, file.name);
    event.target.value = '';
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">1) Carga de datos</h2>
      <p className="mt-2 text-sm text-slate-600">
        Carga un archivo Excel con columnas <strong>SKU</strong>, <strong>Date</strong> y <strong>Stock</strong>.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-700"
      >
        Seleccionar archivo (.xlsx, .xls, .csv)
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}

export default FileUpload;
