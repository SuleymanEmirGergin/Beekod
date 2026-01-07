import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  showShortcut?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({
  placeholder = 'Search orders, products, or customers (Cmd+K)',
  showShortcut = true,
  value,
  onChange,
  onFocus,
  onBlur,
}: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full pl-10 pr-16 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
      />
      {showShortcut && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-500">
            ⌘K
          </kbd>
        </div>
      )}
    </div>
  );
}
