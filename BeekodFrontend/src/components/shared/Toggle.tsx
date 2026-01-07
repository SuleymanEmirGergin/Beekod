import { InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export function Toggle({ label, description, className = '', ...props }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="flex flex-col flex-1">
        {label && <span className="text-sm text-gray-900">{label}</span>}
        {description && <span className="text-xs text-gray-500">{description}</span>}
      </div>
      <div className="relative">
        <input type="checkbox" className="sr-only peer" {...props} />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#F5B800] transition-colors duration-200"></div>
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-5"></div>
      </div>
    </label>
  );
}
