import React from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { type Expense } from '../../types';

interface MetricsGridProps {
  expenses: Expense[];
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ expenses }) => {
  // Gelir: amount > 0
  const totalIncome = expenses
    .filter((e) => Number(e.amount) > 0)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Gider: amount < 0
  const totalExpense = expenses
    .filter((e) => Number(e.amount) < 0)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

  const balance = totalIncome - totalExpense;
  const isPositiveBalance = balance >= 0;

  // Tasarruf oranı
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Total Balance Card */}
      <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-950/40 glow-card group transition-all duration-300 hover:border-slate-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Net Bakiye
            </span>
            <div
              className={`text-3xl font-extrabold mt-2 font-tabular tracking-tight ${
                isPositiveBalance ? 'text-white' : 'text-rose-400'
              }`}
            >
              {isPositiveBalance ? '' : '-'}
              {formatCurrency(Math.abs(balance))} <span className="text-lg font-bold text-slate-400">TL</span>
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
              isPositiveBalance
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>Tasarruf Oranı:</span>
          </div>
          <span
            className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
              savingsRate >= 20
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : savingsRate > 0
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            %{savingsRate}
          </span>
        </div>
      </div>

      {/* 2. Total Income Card */}
      <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-950/40 glow-card group transition-all duration-300 hover:border-slate-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Gelir
            </span>
            <div className="text-3xl font-extrabold mt-2 font-tabular tracking-tight text-emerald-400">
              +{formatCurrency(totalIncome)} <span className="text-lg font-bold text-slate-400">TL</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="inline-flex items-center gap-0.5 text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              {expenses.filter((e) => Number(e.amount) > 0).length} işlem
            </span>
          </div>
          <span className="text-slate-500">•</span>
          <span>Maaş ve yan gelirler</span>
        </div>
      </div>

      {/* 3. Total Expense Card */}
      <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-950/40 glow-card group transition-all duration-300 hover:border-slate-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Gider
            </span>
            <div className="text-3xl font-extrabold mt-2 font-tabular tracking-tight text-rose-400">
              -{formatCurrency(totalExpense)} <span className="text-lg font-bold text-slate-400">TL</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="inline-flex items-center gap-0.5 text-rose-400 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>
              {expenses.filter((e) => Number(e.amount) < 0).length} işlem
            </span>
          </div>
          <span className="text-slate-500">•</span>
          <span>Harcamalar ve faturalar</span>
        </div>
      </div>
    </div>
  );
};
