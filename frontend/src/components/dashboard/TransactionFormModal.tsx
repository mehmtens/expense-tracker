import React, { useState } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { CategoryKey, ExpenseInput, TransactionType } from '../../types';
import { CATEGORY_CONFIG } from '../ui/CategoryIcon';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseInput) => Promise<void>;
}

const EXPENSE_CATEGORIES: CategoryKey[] = [
  'Market',
  'Yemek',
  'Ulaşım',
  'Fatura',
  'Eğlence',
  'Eğitim',
  'Sağlık',
  'Alışveriş',
  'Kira',
  'Diğer',
];

const INCOME_CATEGORIES: CategoryKey[] = ['Maaş', 'Yatırım', 'Diğer'];

const AMOUNT_PRESETS = [50, 100, 250, 500, 1000, 2500];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<CategoryKey>('Market');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'expense' ? 'Market' : 'Maaş');
  };

  const handlePresetClick = (presetVal: number) => {
    setAmount(presetVal.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount.replace(',', '.'));
    if (!title.trim()) {
      setError('Lütfen bir işlem başlığı girin.');
      return;
    }
    if (isNaN(parsed) || parsed <= 0) {
      setError('Lütfen geçerli ve sıfırdan büyük bir tutar girin.');
      return;
    }

    // Backend kuralı: Giderler negatif, Gelirler pozitif
    const finalAmount = type === 'expense' ? -Math.abs(parsed) : Math.abs(parsed);

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        amount: finalAmount,
        category,
      });
      // Reset
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory('Market');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'İşlem eklenirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Finansal İşlem"
      subtitle="Gelir veya gider kaydı oluşturun"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Toggle Segmented Control */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-rose-400" />
            <span>Gider (-)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
            <span>Gelir (+)</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-1.5">
          <label htmlFor="tx-title" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            İşlem Başlığı
          </label>
          <input
            id="tx-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={type === 'expense' ? 'örn. Haftalık Market Alışverişi' : 'örn. Ağustos Maaşı'}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
          />
        </div>

        {/* Amount Input & Presets */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="tx-amount" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Tutar (TL)
            </label>
            <span className="text-[11px] text-slate-500 font-mono">0.00 TL</span>
          </div>
          <div className="relative">
            <input
              id="tx-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-base font-semibold font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
              TL
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {AMOUNT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetClick(p)}
                className="text-[11px] font-mono font-medium px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                +{p}
              </button>
            ))}
          </div>
        </div>

        {/* Category Dropdown & Grid */}
        <div className="space-y-1.5">
          <label htmlFor="tx-category" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Kategori
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {categories.map((catKey) => {
              const config = CATEGORY_CONFIG[catKey] || {
                label: catKey,
                icon: Plus,
                color: 'text-slate-400',
                bg: 'bg-slate-800',
              };
              const IconComponent = config.icon;
              const isSelected = category === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategory(catKey)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 shrink-0 ${config.color}`} />
                  <span className="truncate">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer text-sm"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer text-sm ${
              type === 'expense'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 shadow-rose-600/20'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-600/20'
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{type === 'expense' ? 'Gider Ekle' : 'Gelir Ekle'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
