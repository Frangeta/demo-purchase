const classOptions = ['A', 'B', 'C'];

const classPillStyles = {
  A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function NumberField({ label, value, onChange, min = 0, step = 1 }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border-slate-300 text-sm focus:border-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-900"
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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="material-icons-outlined">settings</span>
        </div>
        <h2 className="text-lg font-semibold">2) Configuration</h2>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label="Consumption Window (N)"
          value={config.windowDays}
          onChange={(value) => onConfigChange({ ...config, windowDays: Number(value) })}
          min={1}
        />
        <NumberField
          label="Forecast Horizon (H)"
          value={config.horizonDays}
          onChange={(value) => onConfigChange({ ...config, horizonDays: Number(value) })}
          min={1}
        />
        <NumberField
          label="Safety Days (+d)"
          value={config.safetyExtraDays}
          onChange={(value) => onConfigChange({ ...config, safetyExtraDays: Number(value) })}
          min={0}
        />
        <NumberField
          label="Rounding Multiplier"
          value={config.roundingMultiple}
          onChange={(value) => onConfigChange({ ...config, roundingMultiple: Number(value) })}
          min={1}
        />
      </div>

      <div className="space-y-4">
        <h3 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-widest text-slate-400 dark:border-slate-700">
          Class Thresholds
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {classOptions.map((className) => (
            <div key={className} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <span className={`mb-3 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${classPillStyles[className]}`}>
                CLASS {className}
              </span>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">MIN %</label>
                  <input
                    className="w-16 rounded border-slate-300 px-2 py-1 text-right text-sm dark:border-slate-600 dark:bg-slate-900"
                    type="number"
                    min={0}
                    value={config.classThresholds[className].minPct}
                    onChange={(event) => updateClassThreshold(className, 'minPct', event.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">BUY %</label>
                  <input
                    className="w-16 rounded border-slate-300 px-2 py-1 text-right text-sm dark:border-slate-600 dark:bg-slate-900"
                    type="number"
                    min={0}
                    value={config.classThresholds[className].buyPct}
                    onChange={(event) => updateClassThreshold(className, 'buyPct', event.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] italic text-slate-400">Note: BUY% must be greater than MIN%. Adjust based on safety stock logic.</p>
      </div>
    </div>
  );
}

export default ConfigPanel;
