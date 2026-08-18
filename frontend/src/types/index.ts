export type User = {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  email_verified?: boolean;
  auth_provider?: 'password' | 'google';
};

export type RegisterResponse = {
  user: User;
  verification_required: boolean;
  development_verification_url?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type CategoryKey =
  | 'Market'
  | 'Yemek'
  | 'Ulaşım'
  | 'Fatura'
  | 'Eğlence'
  | 'Eğitim'
  | 'Sağlık'
  | 'Maaş'
  | 'Yatırım'
  | 'Kira'
  | 'Alışveriş'
  | 'Diğer';

export type Expense = {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  category: CategoryKey | string;
  created_at: string;
};

export type ExpenseInput = {
  title: string;
  amount: number;
  category: CategoryKey | string;
};

export type TransactionType = 'expense' | 'income';

export type ToastType = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
};

export type FilterState = {
  search: string;
  category: string;
  type: 'all' | 'income' | 'expense';
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
};
