import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface MetricCardProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  label: string;
  value: string | number;
  trend?: string;
  trendColor?: string;
  statusLabel?: string;
  statusColor?: string;
  variant?: 'default' | 'warning';
  onClick?: () => void;
  borderColor?: string;
}

export function MetricCard({
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50',
  label,
  value,
  trend,
  trendColor = 'text-green-600',
  statusLabel,
  statusColor = 'text-gray-900',
  variant = 'default',
  onClick,
  borderColor,
}: MetricCardProps) {
  const defaultBorder = variant === 'warning' ? 'border-yellow-200' : 'border-gray-100';
  const finalBorder = borderColor || defaultBorder;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border-2 transition-all hover:shadow-lg ${finalBorder} ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && <span className={`text-sm ${trendColor}`}>{trend}</span>}
        {statusLabel && (
          <span
            className={`text-xs px-2 py-1 rounded ${
              statusLabel === 'Needs Action'
                ? 'bg-yellow-50 text-yellow-700'
                : statusLabel === 'Pending'
                  ? 'bg-purple-50 text-purple-700'
                  : statusLabel === 'Connected'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-50 text-gray-700'
            }`}
          >
            {statusLabel}
          </span>
        )}
      </div>
      <div>
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className={`text-2xl ${statusColor}`}>{value}</div>
      </div>
    </div>
  );
}
