import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: ReactNode;
    onIconClick?: () => void;
}

export function Input({ label, icon, onIconClick, className = '', ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label className="text-sm text-gray-900">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    className={`w-full px-4 py-3 rounded-lg border border-gray-200 bg-[#FFFBF0] text-gray-900 placeholder:text-[#B8934D] focus:outline-none focus:border-[#F5B800] transition-colors ${className}`}
                    {...props}
                />
                {icon && (
                    <button
                        type="button"
                        onClick={onIconClick}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8934D] hover:text-gray-900"
                    >
                        {icon}
                    </button>
                )}
            </div>
        </div>
    );
}
