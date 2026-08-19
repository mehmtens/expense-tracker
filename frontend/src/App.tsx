import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { api } from './services/api';
import type { Expense, ExpenseInput, FilterState } from './types';
import { AuthCard } from './components/auth/AuthCard';
import { Navbar } from './components/dashboard/Navbar';
import { MetricsGrid } from './components/dashboard/MetricsGrid';
import { ExpenseCharts } from './components/dashboard/ExpenseCharts';
import { TransactionFilters } from './components/dashboard/TransactionFilters';
import { TransactionList } from './components/dashboard/TransactionList';
import { TransactionFormModal } from './components/dashboard/TransactionFormModal';
import { DashboardSkeleton } from './components/ui/Skeleton';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    type: 'all',
    sortBy: 'date-desc',
  });

  const loadExpenses = useCallback(async () => {
    setIsLoadingExpenses(true);
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'İşlemler yüklenemedi.';
      showToast(message, 'error', 'Hata');
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      // Expense loading is intentionally synchronized with authentication state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadExpenses();
    }
  }, [isAuthenticated, loadExpenses]);

  // Create Transaction
  const handleCreateExpense = async (input: ExpenseInput) => {
    try {
      const newTx = await api.createExpense(input);
      setExpenses((prev) => [newTx, ...prev]);
      showToast(
        `${input.amount >= 0 ? 'Gelir' : 'Gider'} işlemi başarıyla eklendi.`,
        'success',
        'İşlem Başarılı'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'İşlem eklenemedi.';
      showToast(message, 'error', 'Hata');
      throw err;
    }
  };

  // Delete Transaction
  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      showToast('İşlem kaydı başarıyla silindi.', 'info', 'Silindi');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'İşlem silinemedi.';
      showToast(message, 'error', 'Hata');
    }
  };

  // Available unique categories
  const categories = useMemo(() => {
    const defaultList = [
      'Market',
      'Yemek',
      'Ulaşım',
      'Fatura',
      'Eğlence',
      'Eğitim',
      'Sağlık',
      'Maaş',
      'Yatırım',
      'Alışveriş',
      'Kira',
      'Diğer',
    ];
    const fromData = Array.from(new Set(expenses.map((e) => e.category).filter(Boolean)));
    return Array.from(new Set([...defaultList, ...fromData]));
  }, [expenses]);

  // Filtered & Sorted Transactions
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        // Search filter (in title or category)
        if (filters.search.trim()) {
          const query = filters.search.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchCategory = item.category.toLowerCase().includes(query);
          if (!matchTitle && !matchCategory) return false;
        }

        // Type filter
        const isIncome = Number(item.amount) >= 0;
        if (filters.type === 'income' && !isIncome) return false;
        if (filters.type === 'expense' && isIncome) return false;

        // Category filter
        if (filters.category !== 'all' && item.category !== filters.category) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date-desc') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (filters.sortBy === 'date-asc') {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (filters.sortBy === 'amount-desc') {
          return Math.abs(Number(b.amount)) - Math.abs(Number(a.amount));
        }
        if (filters.sortBy === 'amount-asc') {
          return Math.abs(Number(a.amount)) - Math.abs(Number(b.amount));
        }
        return 0;
      });
  }, [expenses, filters]);

  // If Auth check is loading
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If unauthenticated -> Render Auth Card
  if (!isAuthenticated) {
    return <AuthCard />;
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      {/* Sticky Top Navbar */}
      <Navbar onNewTransaction={() => setIsModalOpen(true)} />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {isLoadingExpenses ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* 1. Metrics Overview Cards */}
            <MetricsGrid expenses={expenses} />

            {/* 2. Visual Analytics (Charts) */}
            <ExpenseCharts expenses={expenses} />

            {/* 3. Recent Transactions Feed */}
            <section className="bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl shadow-slate-950/40 glow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Finansal İşlem Geçmişi</h3>
                  <p className="text-xs text-slate-400">
                    Toplam {filteredExpenses.length} işlem listeleniyor
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadExpenses}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Yenile"
                    aria-label="Yenile"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <TransactionFilters
                filters={filters}
                onChange={setFilters}
                categories={categories}
              />

              {/* Transactions List */}
              <TransactionList
                expenses={filteredExpenses}
                onDelete={handleDeleteExpense}
                onNewTransaction={() => setIsModalOpen(true)}
              />
            </section>
          </>
        )}
      </main>

      {/* New Transaction Modal Dialog */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
    </div>
  );
}
