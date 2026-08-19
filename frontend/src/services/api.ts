import { type AuthResponse, type Expense, type ExpenseInput, type RegisterResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async register(username: string, email: string, password: string): Promise<RegisterResponse> {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Kayıt işlemi başarısız oldu');
    }

    return res.json();
  },

  async verifyEmail(token: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    if (!res.ok) throw new Error(await res.text() || 'E-posta doğrulanamadı.');
  },

  async resendVerification(email: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/resend-verification`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (!res.ok) throw new Error(await res.text() || 'E-posta gönderilemedi.');
  },

  async forgotPassword(email: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (!res.ok) throw new Error(await res.text() || 'Şifre yenileme e-postası gönderilemedi.');
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    if (!res.ok) throw new Error(await res.text() || 'Şifre yenilenemedi.');
  },

  // Keep the OAuth state cookie and callback on the public Kuruş domain.
  googleLogin(): void { window.location.assign('/auth/google'); },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, password }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Giriş bilgileri hatalı');
    }

    return res.json();
  },

  async getExpenses(): Promise<Expense[]> {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      }
      const errorText = await res.text();
      throw new Error(errorText || 'İşlemler yüklenemedi');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async createExpense(data: ExpenseInput): Promise<Expense> {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'İşlem kaydedilemedi');
    }

    return res.json();
  },

  async deleteExpense(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'İşlem silinemedi');
    }
  },
};
