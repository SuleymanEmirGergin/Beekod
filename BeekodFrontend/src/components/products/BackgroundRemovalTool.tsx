import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, X, Check } from 'lucide-react';
import { removeBackground } from '../../services/ai'; // Using backend tool service logic via AI service
import { ToastV2 } from '../shared/';

interface BackgroundRemovalToolProps {
  imageUrl: string;
  onProcessed: (newImageUrl: string) => void;
  onClose: () => void;
}

export function BackgroundRemovalTool({
  imageUrl,
  onProcessed,
  onClose,
}: BackgroundRemovalToolProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const result = await removeBackground(imageUrl);
      setProcessedUrl(result);
      setToast({ title: 'Success', message: 'Background removed successfully!' });
    } catch (error) {
      setToast({ title: 'Error', message: 'Failed to process image.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Background Remover</h3>
              <p className="text-xs text-gray-500">Transform your product photos instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            {/* Original */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Original</p>
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <img src={imageUrl} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Processed */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                AI Result
              </p>
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center relative">
                {processedUrl ? (
                  <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]">
                    <img
                      src={processedUrl}
                      alt="Processed"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center p-6">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-8 h-8 text-[#F5B800] animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-600 font-medium">Magic in progress...</p>
                        <p className="text-xs text-gray-400 mt-1">Removing background details</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">Preview will appear here</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {!processedUrl ? (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Remove Background
              </button>
            ) : (
              <>
                <button
                  onClick={() => onProcessed(processedUrl)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 font-medium rounded-xl transition-all"
                >
                  <Check className="w-5 h-5" />
                  Use This Image
                </button>
                <button
                  onClick={() => setProcessedUrl(null)}
                  className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-all"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <ToastV2
          title={toast.title}
          message={toast.message}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
