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
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="material-icons-outlined">upload_file</span>
        </div>
        <h2 className="text-lg font-semibold">1) Data Import</h2>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Upload your daily stock report in Excel format. Ensure columns: <strong>SKU, Date, Stock</strong> are present in
        the first sheet.
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
        className="group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-8 text-center transition-colors hover:border-primary dark:border-slate-600"
      >
        <span className="material-icons-outlined mb-2 text-4xl text-slate-400 transition-colors group-hover:text-primary">cloud_upload</span>
        <p className="mb-4 text-sm font-medium">Drop your Excel file here</p>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
        >
          <span>Upload Excel</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

export default FileUpload;
