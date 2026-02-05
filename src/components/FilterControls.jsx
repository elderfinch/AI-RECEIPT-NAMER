const FILTERS = [
  { id: 'original', label: 'Original' },
  { id: 'grayscale', label: 'Grayscale' },
  { id: 'scan', label: 'Scan/Binary' },
  { id: 'magic', label: 'Magic Color' },
];

export default function FilterControls({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          className={`rounded-lg border px-3 py-1.5 text-sm ${value === filter.id ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'}`}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
