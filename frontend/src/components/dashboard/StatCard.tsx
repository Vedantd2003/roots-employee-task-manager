import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  color?: 'default' | 'green' | 'blue' | 'yellow' | 'red' | 'orange' | 'gray';
  description?: string;
}

const colorStyles = {
  default: { card: 'bg-white', icon: 'bg-brand/10 text-brand', value: 'text-gray-900' },
  green: { card: 'bg-white', icon: 'bg-green-100 text-green-600', value: 'text-green-700' },
  blue: { card: 'bg-white', icon: 'bg-blue-100 text-blue-600', value: 'text-blue-700' },
  yellow: { card: 'bg-white', icon: 'bg-yellow-100 text-yellow-600', value: 'text-yellow-700' },
  red: { card: 'bg-white', icon: 'bg-red-100 text-red-600', value: 'text-red-700' },
  orange: { card: 'bg-white', icon: 'bg-orange-100 text-orange-600', value: 'text-orange-700' },
  gray: { card: 'bg-white', icon: 'bg-gray-100 text-gray-500', value: 'text-gray-600' },
};

export function StatCard({ label, value, icon: Icon, color = 'default', description }: StatCardProps) {
  const styles = colorStyles[color];
  return (
    <div className={`${styles.card} rounded-lg border border-gray-200 shadow-sm p-5 flex items-center gap-4`}>
      {Icon && (
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.icon} flex items-center justify-center`}>
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${styles.value}`}>{value}</p>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
    </div>
  );
}
