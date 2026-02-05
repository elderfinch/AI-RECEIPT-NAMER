import { Trash2 } from 'lucide-react';

export default function PageList({ pages, activeId, onSelect, onDelete }) {
  return (
    <aside className="w-full space-y-2 lg:w-64">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pages</h3>
      <div className="flex gap-2 overflow-auto lg:block lg:space-y-2">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`min-w-32 cursor-pointer rounded-lg border p-2 ${activeId === page.id ? 'border-blue-500' : 'border-slate-300 dark:border-slate-700'}`}
            onClick={() => onSelect(page.id)}
          >
            <img src={page.preview} alt={`Page ${index + 1}`} className="mb-2 h-24 w-full rounded object-cover" />
            <div className="flex items-center justify-between text-xs">
              <span>Page {index + 1}</span>
              <button onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}>
                <Trash2 size={14} className="text-rose-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
