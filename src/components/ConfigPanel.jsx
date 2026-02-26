const classOptions = ['A', 'B', 'C'];

function NumberField({ label, value, onChange, min = 0, step = 1 }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">2) Configuración</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label="Ventana consumo N"
          value={config.windowDays}
          onChange={(value) => onConfigChange({ ...config, windowDays: Number(value) })}
          min={1}
        />
        <NumberField
          label="Horizonte H"
          value={config.horizonDays}
          onChange={(value) => onConfigChange({ ...config, horizonDays: Number(value) })}
          min={1}
        />
        <NumberField
          label="Días extra seguridad"
          value={config.safetyExtraDays}
          onChange={(value) => onConfigChange({ ...config, safetyExtraDays: Number(value) })}
          min={0}
        />
        <NumberField
          label="Múltiplo redondeo"
          value={config.roundingMultiple}
          onChange={(value) => onConfigChange({ ...config, roundingMultiple: Number(value) })}
          min={1}
        />
      </div>

      <h3 className="mt-6 text-sm font-semibold text-slate-700">Umbrales por clase</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {classOptions.map((className) => (
          <article key={className} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold">Clase {className}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
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
          </article>
        ))}
      </div>
    </section>
  );
}

export default ConfigPanel;
