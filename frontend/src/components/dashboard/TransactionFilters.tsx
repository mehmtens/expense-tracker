import React from 'react';
import { Search, X } from 'lucide-react';
import type { FilterState } from '../../types';

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  categories: string[];
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onChange,
  categories,
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="İşlemlerde ara (başlık, kategori)..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type Filter Buttons */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onChange({ ...filters, type: 'all' })}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filters.type === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters, type: 'income' })}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filters.type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gelirler (+)
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters, type: 'expense' })}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filters.type === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Giderler (-)
          </button>
        </div>

        {/* Category Select */}
        <div className="relative">
          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Select */}
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as FilterState['sortBy'],
              })
            }
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
          >
            <option value="date-desc">En Yeni İlk</option>
            <option value="date-asc">En Eski İlk</option>
            <option value="amount-desc">Tutar (En Yüksek)</option>
            <option value="amount-asc">Tutar (En Düşük)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
