import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: ReactNode;
    fullWidth?: boolean;
}

export function Button({
    variant = 'primary',
    children,
    fullWidth = false,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles = "px-4 py-3 rounded-lg transition-colors duration-200";

    const variantStyles = {
        primary: "bg-[#F5B800] hover:bg-[#E5A800] text-black",
        secondary: "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-700"
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
