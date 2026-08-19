import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SocialAuth } from './SocialAuth';
import { KurusLogo } from '../ui/KurusLogo';

type Mode = 'login' | 'register' | 'forgot' | 'reset';
const initialMode = (): Mode => new URLSearchParams(location.search).has('reset') ? 'reset' : 'login';
export function AuthCard() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode), [username, setUsername] = useState(''), [email, setEmail] = useState(''), [identifier, setIdentifier] = useState(''), [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false), [loading, setLoading] = useState(false), [verificationSent, setVerificationSent] = useState(false), [pendingEmail, setPendingEmail] = useState('');
  const initialParams = useMemo(() => new URLSearchParams(location.search), []);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(() => {
    const oauthError = initialParams.get('auth_error');
    return oauthError ? { kind: 'error', text: oauthError } : null;
  });
  const passwordScore = useMemo(() => [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password)].filter(Boolean).length, [password]);

  useEffect(() => {
    const token = initialParams.get('verify');
    if (!token) return;
    api.verifyEmail(token).then(() => { setMessage({ kind: 'success', text: 'E-postan doğrulandı. Artık hesabına giriş yapabilirsin.' }); setMode('login'); }).catch((e: Error) => setMessage({ kind: 'error', text: e.message })).finally(() => { setLoading(false); history.replaceState({}, '', location.pathname); });
  }, [initialParams]);
  const switchMode = (next: Mode) => { setMode(next); setMessage(null); setVerificationSent(false); };
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(null);
    if (mode === 'register' && (!username.trim() || !email.includes('@'))) return setMessage({ kind: 'error', text: 'Kullanıcı adı ve geçerli bir e-posta adresi gir.' });
    if (password.length < 6) return setMessage({ kind: 'error', text: 'Şifre en az 6 karakter olmalı.' });
    setLoading(true);
    try { if (mode === 'register') { const result = await register(username.trim(), email.trim(), password); setPendingEmail(result.user.email); setVerificationSent(true); setMessage({ kind: 'success', text: 'Doğrulama bağlantısını gönderdik. Gelen kutunu kontrol et.' }); } else await login(identifier.trim(), password); }
    catch (e) { setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'İşlem tamamlanamadı.' }); } finally { setLoading(false); }
  }
  async function resend() { setLoading(true); try { await api.resendVerification(pendingEmail || email); setMessage({ kind: 'success', text: 'Yeni doğrulama bağlantısı gönderildi.' }); } catch (e) { setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Gönderilemedi.' }); } finally { setLoading(false); } }
  async function requestReset(event: FormEvent) { event.preventDefault(); setLoading(true); setMessage(null); try { await api.forgotPassword(email.trim()); setMessage({ kind: 'success', text: 'Hesap uygunsa şifre yenileme bağlantısını gönderdik.' }); } catch (e) { setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Gönderilemedi.' }); } finally { setLoading(false); } }
  async function confirmReset(event: FormEvent) { event.preventDefault(); if (password.length < 8) return setMessage({ kind: 'error', text: 'Yeni şifre en az 8 karakter olmalı.' }); setLoading(true); try { await api.resetPassword(new URLSearchParams(location.search).get('reset') || '', password); history.replaceState({}, '', location.pathname); setMode('login'); setPassword(''); setMessage({ kind: 'success', text: 'Şifren yenilendi. Şimdi giriş yapabilirsin.' }); } catch (e) { setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Şifre yenilenemedi.' }); } finally { setLoading(false); } }

  return <main className="auth-shell">
    <div className="auth-noise" aria-hidden="true" />
    <section className="auth-story" aria-label="Ürün tanıtımı">
      <a className="auth-brand" href="/" aria-label="Kuruş ana sayfa"><KurusLogo />Kuruş</a>
      <div className="brand-showcase" aria-hidden="true"><img src="/kurus-social.png" alt="" /><span /></div>
      <div className="story-copy"><span className="eyebrow"><span /> Her kuruşun görünür</span><h1>Para sende,<br /><em>karar sende.</em></h1><p>Gelirini, giderini ve hedeflerini tek yerde gör. Bütçeni güvenle yönet, kararlarını net ver.</p><div className="trust-row"><span><Check /> Banka düzeyinde güvenlik</span><span><Check /> Ücretsiz başlangıç</span></div></div>
      <p className="story-foot">Kuruş · Akıllı bütçe yönetimi</p>
    </section>
    <section className="auth-panel"><div className="mobile-brand"><KurusLogo /> Kuruş</div><div className="auth-card">
      <div className="auth-heading"><span className="auth-kicker">{mode === 'login' ? 'Tekrar hoş geldin' : mode === 'register' ? 'Kontrolü eline al' : 'Hesap güvenliği'}</span><h2>{mode === 'login' ? 'Hesabına giriş yap' : mode === 'register' ? 'Ücretsiz hesabını oluştur' : mode === 'forgot' ? 'Şifreni yenile' : 'Yeni şifreni belirle'}</h2><p>{mode === 'login' ? 'Bütçen kaldığı yerden devam ediyor.' : mode === 'register' ? 'Bir dakikadan kısa sürede Kuruş’a katıl.' : mode === 'forgot' ? 'E-postana güvenli bir yenileme bağlantısı göndereceğiz.' : 'En az 8 karakterlik güçlü bir şifre seç.'}</p></div>
      {(mode === 'login' || mode === 'register') && <div className="mode-switch" role="tablist" aria-label="Kimlik doğrulama seçeneği"><button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>Giriş yap</button><button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')}>Kayıt ol</button></div>}
      {message && <div className={`auth-message ${message.kind}`} role="alert"><ShieldCheck />{message.text}</div>}
      {mode === 'forgot' ? <form onSubmit={requestReset} className="auth-form"><Field icon={<Mail />} label="E-posta"><input required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" type="email" placeholder="sen@ornek.com" /></Field><button className="primary-action" disabled={loading}>{loading ? <span className="spinner" /> : <>Bağlantıyı gönder<ArrowRight /></>}</button><button type="button" className="text-action" onClick={() => switchMode('login')}>Giriş ekranına dön</button></form> : mode === 'reset' ? <form onSubmit={confirmReset} className="auth-form"><Field icon={<LockKeyhole />} label="Yeni şifre"><input required value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" type={showPassword ? 'text' : 'password'} placeholder="En az 8 karakter" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>{showPassword ? <EyeOff /> : <Eye />}</button></Field><button className="primary-action" disabled={loading}>{loading ? <span className="spinner" /> : <>Şifremi yenile<ArrowRight /></>}</button></form> : verificationSent ? <div className="verify-state"><div className="verify-icon"><Mail /></div><h3>E-postanı kontrol et</h3><p><strong>{pendingEmail}</strong> adresine gönderdiğimiz bağlantıyla hesabını doğrula.</p><button className="primary-action" onClick={resend} disabled={loading}>Bağlantıyı tekrar gönder</button><button className="text-action" onClick={() => switchMode('login')}>Giriş ekranına dön</button></div> : <>
        <SocialAuth onGoogleClick={() => api.googleLogin()} /><div className="auth-divider"><span>ya da e-posta ile</span></div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <><Field icon={<UserRound />} label="Kullanıcı adı"><input required value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" placeholder="ör. denizaksoy" /></Field><Field icon={<Mail />} label="E-posta"><input required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" type="email" placeholder="sen@ornek.com" /></Field></>}
          {mode === 'login' && <Field icon={<UserRound />} label="E-posta veya kullanıcı adı"><input required value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" placeholder="sen@ornek.com" /></Field>}
          <Field icon={<LockKeyhole />} label="Şifre" action={mode === 'login' ? <button type="button" className="forgot" onClick={() => switchMode('forgot')}>Şifremi unuttum</button> : undefined}><input required value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type={showPassword ? 'text' : 'password'} placeholder="En az 6 karakter" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>{showPassword ? <EyeOff /> : <Eye />}</button></Field>
          {mode === 'register' && <div className="strength" aria-label={`Şifre gücü ${passwordScore} / 3`}><span className={passwordScore > 0 ? 'on' : ''}/><span className={passwordScore > 1 ? 'on' : ''}/><span className={passwordScore > 2 ? 'on' : ''}/><small>{passwordScore < 2 ? 'Daha güçlü bir şifre seç' : 'Güçlü şifre'}</small></div>}
          <button className="primary-action" disabled={loading}>{loading ? <span className="spinner" /> : <>{mode === 'login' ? 'Akışıma devam et' : 'Hesabımı oluştur'}<ArrowRight /></>}</button>
        </form></>}
      <p className="legal">Devam ederek <a href="/terms.html" target="_blank" rel="noreferrer">Kullanım Koşulları</a> ve <a href="/privacy.html" target="_blank" rel="noreferrer">Gizlilik Politikası</a>’nı kabul edersin.</p>
    </div></section>
  </main>;
}
function Field({ icon, label, action, children }: { icon: ReactNode; label: string; action?: ReactNode; children: ReactNode }) { return <label className="auth-field"><span className="field-label">{label}{action}</span><span className="field-control"><i aria-hidden="true">{icon}</i>{children}</span></label>; }
