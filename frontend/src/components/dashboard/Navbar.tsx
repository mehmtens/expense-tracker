import React from 'react';
import { Calendar, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { KurusLogo } from '../ui/KurusLogo';

interface NavbarProps {
  onNewTransaction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewTransaction }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast('Oturumunuz başarıyla sonlandırıldı.', 'info', 'Çıkış Yapıldı');
  };

  const currentMonthName = new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand & Month */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <KurusLogo className="w-9 h-9 drop-shadow-[0_8px_18px_rgba(37,184,170,.24)]" />
            <div className="hidden sm:block">
              <h1 className="text-base font-bold tracking-tight text-white leading-none">Kuruş</h1>
              <span className="text-[11px] text-slate-400 font-medium">Para sende, karar sende.</span>
            </div>
          </div>

          {/* Active Month Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize">{currentMonthName}</span>
          </div>
        </div>

        {/* Right: Quick Action & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewTransaction}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Yeni İşlem</span>
          </button>

          {/* User Badge */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shadow-inner">
              {userInitial}
            </div>

            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {user?.username ? `@${user.username}` : 'Kullanıcı'}
              </div>
              <div className="text-[10px] text-slate-400 max-w-[120px] truncate leading-tight">
                {user?.email}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              title="Çıkış Yap"
              aria-label="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
