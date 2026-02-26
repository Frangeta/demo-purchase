const classOptions = ['A', 'B', 'C'];

function NumberField({ label, value, onChange, min = 0, step = 1 }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
      />
    </label>
  );
}

function ConfigPanel({ config, onConfigChange }) {
  const updateClassThreshold = (productClass, field, value) => {
    onConfigChange({
      ...config,
      classThresholds: {
        ...config.classThresholds,
        [productClass]: {
          ...config.classThresholds[productClass],
          [field]: Number(value),
        },
      },
    });
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">2) Configuración</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label="Ventana de consumo (N intervalos)"
          value={config.windowDays}
          onChange={(value) => onConfigChange({ ...config, windowDays: Number(value) })}
          min={1}
        />
        <NumberField
          label="Horizonte forecast (H días)"
          value={config.horizonDays}
          onChange={(value) => onConfigChange({ ...config, horizonDays: Number(value) })}
          min={1}
        />
        <NumberField
          label="Seguridad +días"
          value={config.safetyExtraDays}
          onChange={(value) => onConfigChange({ ...config, safetyExtraDays: Number(value) })}
          min={0}
        />
        <NumberField
          label="Redondeo sugerido (múltiplos)"
          value={config.roundingMultiple}
          onChange={(value) => onConfigChange({ ...config, roundingMultiple: Number(value) })}
          min={1}
        />
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Umbrales por clase</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {classOptions.map((className) => (
            <div key={className} className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 font-semibold text-slate-800">Clase {className}</p>
              <div className="grid gap-2">
                <NumberField
                  label="MIN %"
                  value={config.classThresholds[className].minPct}
                  onChange={(value) => updateClassThreshold(className, 'minPct', value)}
                  min={0}
                />
                <NumberField
                  label="BUY %"
                  value={config.classThresholds[className].buyPct}
                  onChange={(value) => updateClassThreshold(className, 'buyPct', value)}
                  min={0}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">BUY% debe ser mayor que MIN%. Ajusta según tu criterio.</p>
      </div>
    </div>
  );
}

export default ConfigPanel;
