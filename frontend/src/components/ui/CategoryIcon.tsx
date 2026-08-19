import React from 'react';
import {
  ShoppingCart,
  Utensils,
  Car,
  Receipt,
  Film,
  GraduationCap,
  HeartPulse,
  Wallet,
  TrendingUp,
  Home,
  ShoppingBag,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryKey } from '../../types';

interface CategoryConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

// Shared category metadata lives beside the component to keep icon rendering consistent.
// eslint-disable-next-line react-refresh/only-export-components
export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Market: {
    icon: ShoppingCart,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    label: 'Market',
  },
  Yemek: {
    icon: Utensils,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    label: 'Yemek & Restoran',
  },
  Ulaşım: {
    icon: Car,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    label: 'Ulaşım',
  },
  Fatura: {
    icon: Receipt,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    label: 'Fatura & Aidat',
  },
  Eğlence: {
    icon: Film,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    label: 'Eğlence & Hobi',
  },
  Eğitim: {
    icon: GraduationCap,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    label: 'Eğitim & Kurs',
  },
  Sağlık: {
    icon: HeartPulse,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    label: 'Sağlık & Bakım',
  },
  Maaş: {
    icon: Wallet,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    label: 'Maaş & Gelir',
  },
  Yatırım: {
    icon: TrendingUp,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    label: 'Yatırım & Getiri',
  },
  Kira: {
    icon: Home,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    label: 'Kira & Konut',
  },
  Alışveriş: {
    icon: ShoppingBag,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
    label: 'Alışveriş',
  },
  Diğer: {
    icon: Layers,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    label: 'Diğer',
  },
};

// eslint-disable-next-line react-refresh/only-export-components
export const getCategoryConfig = (category: string): CategoryConfig => {
  return (
    CATEGORY_CONFIG[category] || {
      icon: Layers,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10 border-slate-500/20',
      label: category || 'Diğer',
    }
  );
};

interface CategoryIconProps {
  category: CategoryKey | string;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 'md',
  showBackground = true,
}) => {
  const config = getCategoryConfig(category);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (!showBackground) {
    return <IconComponent className={`${iconSizes[size]} ${config.color}`} />;
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 border ${sizeClasses[size]} ${config.bg}`}
    >
      <IconComponent className={`${iconSizes[size]} ${config.color}`} />
    </div>
  );
};
