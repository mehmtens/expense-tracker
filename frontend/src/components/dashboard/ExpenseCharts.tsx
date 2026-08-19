import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { type Expense } from '../../types';
import { getCategoryConfig } from '../ui/CategoryIcon';

interface ExpenseChartsProps {
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Market: '#f59e0b',
  Yemek: '#fb923c',
  Ulaşım: '#38bdf8',
  Fatura: '#facc15',
  Eğlence: '#c084fc',
  Eğitim: '#818cf8',
  Sağlık: '#fb7185',
  Maaş: '#34d399',
  Yatırım: '#2dd4bf',
  Kira: '#22d3ee',
  Alışveriş: '#f472b6',
  Diğer: '#94a3b8',
};

const formatCurrency = (val: number) =>
  `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val)} TL`;

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  payload?: { name: string; value?: number; tutar?: number; color?: string; fill?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  total?: number;
}

const CustomPieTooltip = ({ active, payload, total = 0 }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const value = data.value ?? 0;
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
      <div className="font-semibold text-white flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload?.color || '#94a3b8' }} />
        {data.name || data.payload?.name}
      </div>
      <div className="text-slate-300 font-mono">{formatCurrency(value)} ({percentage}%)</div>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
      <div className="font-semibold text-white">{data.payload?.name}</div>
      <div className="text-slate-300 font-mono font-bold">{formatCurrency(data.value ?? 0)}</div>
    </div>
  );
};

export const ExpenseCharts: React.FC<ExpenseChartsProps> = ({ expenses }) => {
  // Giderlerin kategoriye göre dağılımı
  const expenseTransactions = expenses.filter((e) => Number(e.amount) < 0);

  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach((e) => {
    const cat = e.category || 'Diğer';
    const val = Math.abs(Number(e.amount));
    categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
  });

  const pieData = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value);

  const totalExpenseVal = pieData.reduce((acc, curr) => acc + curr.value, 0);

  // Gelir vs Gider Nakit Akışı Verisi
  const totalIncome = expenses
    .filter((e) => Number(e.amount) > 0)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = expenses
    .filter((e) => Number(e.amount) < 0)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

  const flowData = [
    {
      name: 'Gelir',
      tutar: totalIncome,
      fill: '#10b981', // emerald-500
    },
    {
      name: 'Gider',
      tutar: totalExpense,
      fill: '#f43f5e', // rose-500
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Kategori Dağılımı Donut Chart (2 Kolon) */}
      <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-950/40 glow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Kategori Bazlı Gider Dağılımı</h3>
              <p className="text-xs text-slate-400">Harcamalarınızın kategorilere göre oranı</p>
            </div>
          </div>
          {totalExpenseVal > 0 && (
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Toplam: {formatCurrency(totalExpenseVal)}
            </span>
          )}
        </div>

        {pieData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
            <PieIcon className="w-10 h-10 mb-2 stroke-[1.5] opacity-40" />
            <span>Henüz bir gider kaydı bulunmuyor.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Donut Chart */}
            <div className="md:col-span-3 h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip total={totalExpenseVal} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gider</span>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  {pieData.length} Kategori
                </span>
              </div>
            </div>

            {/* Top Categories Legend */}
            <div className="md:col-span-2 space-y-2 max-h-60 overflow-y-auto pr-1">
              {pieData.map((cat) => {
                const percentage = totalExpenseVal > 0 ? ((cat.value / totalExpenseVal) * 100).toFixed(0) : 0;
                const config = getCategoryConfig(cat.name);
                return (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-300 font-medium truncate">{config.label}</span>
                    </div>
                    <div className="text-right shrink-0 font-mono text-slate-400 pl-2">
                      <span className="text-white font-semibold">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Nakit Akışı Karşılaştırma Bar Chart (1 Kolon) */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-950/40 glow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Nakit Akışı</h3>
              <p className="text-xs text-slate-400">Gelir ve gider dengesi</p>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `${v}`} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="tutar" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Net Durum:</span>
          <span
            className={`font-mono font-bold ${
              totalIncome >= totalExpense ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalIncome >= totalExpense ? '+' : '-'}
            {formatCurrency(Math.abs(totalIncome - totalExpense))}
          </span>
        </div>
      </div>
    </div>
  );
};
