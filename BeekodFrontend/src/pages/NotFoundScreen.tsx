import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="relative w-64 h-64 mb-8">
        {/* Abstract 404 Illustration */}
        <div className="absolute inset-0 bg-yellow-100 rounded-full opacity-50 blur-3xl animate-pulse"></div>
        <div className="relative z-10 w-full h-full flex items-center justify-center">
             <span className="text-[150px] font-black text-gray-900 opacity-10">404</span>
             <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-32 h-32 text-[#F5B800]" />
             </div>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Sayfa Bulunamadı</h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        Aradığınız sayfa silinmiş, taşınmış veya hiç var olmamış olabilir. Kovanımıza geri dönelim!
      </p>

      <div className="flex gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 border border-gray-200 bg-white text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Geri Dön
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-6 py-3 bg-[#F5B800] text-gray-900 font-bold rounded-xl hover:bg-[#E5A800] transition-colors shadow-lg shadow-yellow-200"
        >
          <Home className="w-5 h-5" />
          Ana Sayfa
        </button>
      </div>
    </div>
  );
}
