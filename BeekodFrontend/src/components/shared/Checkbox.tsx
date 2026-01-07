import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={`w-4 h-4 rounded border-gray-300 text-[#F5B800] focus:ring-[#F5B800] focus:ring-offset-0 cursor-pointer ${className}`}
        {...props}
      />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </label>
  );
}
