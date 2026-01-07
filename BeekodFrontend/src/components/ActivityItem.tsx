import { LucideIcon } from 'lucide-react';

interface ActivityItemProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  description: string;
  time: string;
  onClick?: () => void;
}

export function ActivityItem({
  icon: Icon,
  iconColor,
  iconBgColor,
  title,
  description,
  time,
  onClick,
}: ActivityItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 py-3 ${onClick ? 'cursor-pointer hover:bg-gray-50 -mx-5 px-5 rounded-lg transition-colors' : ''}`}
    >
      <div
        className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 mb-0.5">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <div className="text-xs text-gray-400 flex-shrink-0">{time}</div>
    </div>
  );
}
