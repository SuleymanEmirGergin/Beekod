import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalV2Props {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  isOpen: boolean;
}

export function ModalV2({ children, title, subtitle, onClose, isOpen }: ModalV2Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl text-gray-900 mb-1">{title}</h2>
          {subtitle && <p className="text-sm text-[#B8934D]">{subtitle}</p>}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
