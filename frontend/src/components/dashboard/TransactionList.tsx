import React, { useState } from 'react';
import { Trash2, PlusCircle, Inbox, Calendar } from 'lucide-react';
import type { Expense } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Badge } from '../ui/Badge';

interface TransactionListProps {
  expenses: Expense[];
  onDelete: (id: number) => Promise<void>;
  onNewTransaction: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  expenses,
  onDelete,
  onNewTransaction,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return `Bugün, ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      }

      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800/80">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
          <Inbox className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">Kayıtlı İşlem Bulunamadı</h4>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          Arama kriterlerinize uyan bir işlem bulunamadı veya henüz hiç gelir/gider eklemediniz.
        </p>
        <button
          onClick={onNewTransaction}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>İlk İşleminizi Ekleyin</span>
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/60">
      {expenses.map((item) => {
        const numAmount = Number(item.amount);
        const isIncome = numAmount >= 0;
        const isBeingDeleted = deletingId === item.id;

        return (
          <div
            key={item.id}
            className={`group py-3.5 px-3 -mx-3 rounded-2xl transition-all duration-150 flex items-center justify-between gap-4 hover:bg-slate-900/60 ${
              isBeingDeleted ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            {/* Left: Category Icon & Title */}
            <div className="flex items-center gap-3.5 min-w-0">
              <CategoryIcon category={item.category} size="md" />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate tracking-tight">
                    {item.title}
                  </h4>
                  <Badge variant={isIncome ? 'emerald' : 'slate'} size="sm">
                    {item.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Right: Amount & Action */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div
                  className={`text-sm sm:text-base font-bold font-mono font-tabular ${
                    isIncome ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(numAmount)} <span className="text-xs font-medium text-slate-400">TL</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {isIncome ? 'Gelir Kaydı' : 'Harcama'}
                </div>
              </div>

              {/* Delete button (revealed on hover on desktop, always accessible) */}
              <button
                onClick={() => handleDeleteClick(item.id)}
                disabled={isBeingDeleted}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                title="İşlemi Sil"
                aria-label="İşlemi Sil"
              >
                {isBeingDeleted ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-rose-400 rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
