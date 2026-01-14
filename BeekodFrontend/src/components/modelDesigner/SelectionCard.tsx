/**
 * SelectionCard Component
 * Reusable card for image/icon based selection with badge
 */

import { Sparkles } from 'lucide-react';

interface SelectionCardProps {
  id: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  image?: string;
  icon?: string;
  flag?: string;
  sublabel?: string;
  bgColor?: string;
  bgPosition?: string;
  bgImage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SelectionCard({
  id,
  label,
  isSelected,
  onClick,
  image,
  icon,
  flag,
  sublabel,
  bgColor,
  bgPosition,
  bgImage,
  size = 'md',
}: SelectionCardProps) {
  const heights = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-40',
  };

  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden border-2 transition-all w-full ${
        isSelected
          ? 'border-[#F5B800] shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Content Area */}
      {image ? (
        <img
          src={image}
          alt={label}
          className={`w-full ${heights[size]} object-cover`}
        />
      ) : bgImage && bgPosition ? (
        <div
          className={`w-full ${heights[size]}`}
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: '300% 300%',
            backgroundPosition: bgPosition,
          }}
        />
      ) : (
        <div
          className={`w-full ${heights[size]} flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100`}
          style={bgColor ? { backgroundColor: bgColor } : undefined}
        >
          {flag && <p className="text-4xl mb-2">{flag}</p>}
          {icon && <p className="text-3xl mb-1">{icon}</p>}
          {!flag && !icon && sublabel && (
            <p className="text-xs text-gray-500">{sublabel}</p>
          )}
        </div>
      )}

      {/* Label Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-xs text-white text-center">{label}</p>
        {sublabel && !flag && !icon && (
          <p className="text-[10px] text-gray-300 text-center">{sublabel}</p>
        )}
      </div>

      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-gray-900" />
        </div>
      )}
    </button>
  );
}

// Selection Grid wrapper for consistency
interface SelectionGridProps {
  children: React.ReactNode;
  columns?: 2 | 3;
  maxHeight?: string;
}

export function SelectionGrid({ 
  children, 
  columns = 2,
  maxHeight 
}: SelectionGridProps) {
  return (
    <div 
      className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'} ${maxHeight ? `max-h-[${maxHeight}] overflow-y-auto` : ''}`}
    >
      {children}
    </div>
  );
}
