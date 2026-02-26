function formatNumber(value) {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

const CARD_STYLE = {
  totalSkus: 'text-slate-800',
  red: 'text-red-700',
  yellow: 'text-amber-700',
  green: 'text-emerald-700',
  dead: 'text-slate-900',
  units: 'text-indigo-700',
  invest: 'text-violet-700',
  risk: 'text-rose-700',
};

function SummaryCards({ summary }) {
  const cards = [
    { key: 'totalSkus', label: 'SKUs evaluados', value: formatNumber(summary.totalSkus) },
    { key: 'red', label: 'Rojos', value: formatNumber(summary.ROJO) },
    { key: 'yellow', label: 'Amarillos', value: formatNumber(summary.AMARILLO) },
    { key: 'green', label: 'Verdes', value: formatNumber(summary.VERDE) },
    { key: 'dead', label: 'Muertos', value: formatNumber(summary.MUERTO) },
    { key: 'units', label: 'Unidades sugeridas', value: formatNumber(summary.suggestedUnits) },
    { key: 'invest', label: 'Inversión sugerida', value: formatCurrency(summary.suggestedInvestment) },
    { key: 'risk', label: 'Rotura <= 7 días', value: formatNumber(summary.riskSoon) },
  ];

  return (
    <section className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium text-slate-500">{card.label}</p>
          <p className={`mt-1 text-xl font-bold ${CARD_STYLE[card.key]}`}>{card.value}</p>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;
