import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ToastV2Props {
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export function ToastV2({ title, message, isVisible, onClose }: ToastV2Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !show) return null;

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      <div className="bg-gray-900 text-white rounded-xl shadow-lg px-5 py-4 flex items-center gap-3 min-w-[360px]">
        <div className="flex-shrink-0 w-6 h-6 bg-[#F5B800] rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-gray-900" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <div className="text-sm">{title}</div>
          <div className="text-xs text-gray-400">{message}</div>
        </div>
        <button
          onClick={() => {
            setShow(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
