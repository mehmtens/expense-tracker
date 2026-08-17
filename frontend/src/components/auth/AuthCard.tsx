import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SocialAuth } from './SocialAuth';

export const AuthCard: React.FC = () => {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState<boolean>(false);

  const triggerError = (errMsg: string) => {
    setError(errMsg);
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!username.trim()) {
        triggerError('Lütfen bir kullanıcı adı girin.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        triggerError('Lütfen geçerli bir e-posta adresi girin.');
        return;
      }
      if (password.length < 6) {
        triggerError('Şifre en az 6 karakter olmalıdır.');
        return;
      }
    } else {
      if (!loginIdentifier.trim()) {
        triggerError('Lütfen kullanıcı adı veya e-posta girin.');
        return;
      }
      if (!password) {
        triggerError('Lütfen şifrenizi girin.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isRegister) {
        await register(username.trim(), email.trim(), password);
        showToast('Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.', 'success', 'Kayıt Başarılı');
        setIsRegister(false);
        setLoginIdentifier(username.trim() || email.trim());
      } else {
        await login(loginIdentifier.trim(), password);
        showToast('Hoş geldiniz! Finansal verileriniz yüklendi.', 'success', 'Giriş Başarılı');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kimlik doğrulama sırasında bir hata oluştu.';
      triggerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleMock = () => {
    showToast('Google ile giriş desteği yakında eklenecektir.', 'info', 'Bilgilendirme');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/30 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 shadow-lg shadow-blue-500/20 mb-4 border border-blue-400/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Expense Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">Akıllı ve modern kişisel bütçe kontrolü</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/80 glow-card">
          {/* Segmented Mode Switcher */}
          <div className="flex bg-slate-950/70 p-1 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                !isRegister
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                isRegister
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Shake Error Banner */}
          {error && (
            <div
              className={`flex items-start gap-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-sm mb-5 ${
                shouldShake ? 'animate-shake' : ''
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister ? (
              <>
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label htmlFor="auth-username" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Kullanıcı Adı
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="johndoe"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ornek@email.com"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Login Identifier (Username or Email) */
              <div className="space-y-1.5">
                <label htmlFor="auth-identifier" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Kullanıcı Adı veya E-posta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-identifier"
                    name="loginIdentifier"
                    type="text"
                    autoComplete="username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    placeholder="kullanici_adi veya email@site.com"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Şifre
                </label>
                {isRegister && (
                  <span className="text-[11px] text-slate-500">En az 6 karakter</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Hesabı Oluştur' : 'Giriş Yap'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Auth */}
          <div className="mt-6">
            <SocialAuth onGoogleClick={handleGoogleMock} />
          </div>

          {/* Footer Guarantee */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-bit JWT şifreleme ile tam veri güvenliği</span>
          </div>
        </div>
      </div>
    </div>
  );
};
