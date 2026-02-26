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
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">1) Cargar archivo Excel</h2>
          <p className="text-sm text-slate-500">Formato: columnas SKU, Date y Stock en la primera hoja.</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Subir Excel
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default FileUpload;
