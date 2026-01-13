import { CheckCircle2, X, AlertTriangle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface ToastV2Props {
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export function ToastV2({ title, message, isVisible, onClose, type = 'success' }: ToastV2Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to avoid synchronous setState warning
      const rafId = requestAnimationFrame(() => setShow(true));
      
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 4000);
      
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible && !show) return null;



  // If it's the default/success (dark theme), we use specific classes.
  // If it's another type, we might want to use the colored approach I drafted above, 
  // OR keep the dark theme and just change the icon/stripe color.
  // Let's go with a hybrid: Dark theme for everything for consistency, but change accent colors.
  
  // Revised Strategy: Keep it simple and consistent with the existing Code.
  // The existing code was:
  // bg-gray-900 text-white rounded-xl shadow-lg px-5 py-4 flex items-center gap-3 min-w-[360px]
  // Icon container: w-6 h-6 bg-[#F5B800] rounded-full
  
  const getAccentColor = () => {
      switch (type) {
          case 'error': return 'bg-red-500';
          case 'warning': return 'bg-yellow-500';
          case 'info': return 'bg-blue-500';
          case 'success': return 'bg-[#F5B800]'; // Brand yellow
          default: return 'bg-[#F5B800]';
      }
  };

  const getIcon = () => {
      switch (type) {
          case 'error': return <X className="w-4 h-4 text-white" strokeWidth={2.5} />;
          case 'warning': return <AlertTriangle className="w-4 h-4 text-white" strokeWidth={2.5} />;
          case 'info': return <Info className="w-4 h-4 text-white" strokeWidth={2.5} />;
          case 'success': 
          default: return <CheckCircle2 className="w-4 h-4 text-gray-900" strokeWidth={2.5} />;
      }
  };

  const accentColor = getAccentColor();

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
    >
      <div className="bg-gray-900 text-white rounded-xl shadow-lg px-5 py-4 flex items-center gap-3 min-w-[360px]">
        <div className={`flex-shrink-0 w-6 h-6 ${accentColor} rounded-full flex items-center justify-center`}>
          {getIcon()}
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
