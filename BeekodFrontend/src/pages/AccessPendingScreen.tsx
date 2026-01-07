import { AppLogo } from '../components/shared/';
import { Button } from '../components/shared/';
import { Info } from 'lucide-react';

export function AccessPendingScreen({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <AppLogo size={32} />
            <span className="text-xl text-gray-900">Beekod</span>
          </div>
          <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <Info className="w-4 h-4" />
            Yardım Merkezi
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border-t-4 border-[#F5B800] overflow-hidden">
            <div className="p-10">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-[#F5B800]/20 rounded-full blur-2xl scale-150"></div>
                  <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                    {/* Hourglass icon */}
                    <svg
                      className="w-10 h-10 text-[#F5B800]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6 2h12v6l-6 4 6 4v6H6v-6l6-4-6-4V2zm2 2v3l4 2.7 4-2.7V4H8zm0 14h8v-3l-4-2.7-4 2.7v3z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-2xl text-center text-gray-900 mb-4">Erişim Onayı Bekleniyor</h1>

              {/* Description */}
              <p className="text-center text-gray-600 text-sm mb-8 leading-relaxed">
                Beekod'a kaydolduğunuz için teşekkür ederiz. Kapalı devre bir toptancı platformu olarak,
                pazaryerimizin bütünlüğü için tüm işletme bilgilerini manuel olarak doğruluyoruz.
              </p>

              {/* Info box */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-[#F5B800] rounded-full flex items-center justify-center">
                      <Info className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-900 mb-1">Bundan sonra ne olacak?</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Ekibimiz genellikle talepleri 24-48 saat içinde inceler. Erişiminiz onaylandığında
                      bir e-posta onayı alacaksınız.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button fullWidth onClick={onReturn}>
                  Ana Sayfaya Dön
                </Button>
                <Button variant="secondary" fullWidth>
                  Destekle İletişime Geç
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-8 mb-4">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Gizlilik Politikası
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Hizmet Şartları
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Toptancı Sözleşmesi
            </a>
          </div>
          <div className="text-center text-sm text-gray-400">
            © 2024 Beekod Inc. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
