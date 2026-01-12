import { Printer, ArrowLeft, Shield } from 'lucide-react';
import { SidebarV2 } from '../layouts/SidebarV2';

interface PrivacyScreenProps {
  onNavigate: (screen: string) => void;
}

export function PrivacyScreen({ onNavigate }: PrivacyScreenProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem=""
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </button>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                <Printer className="w-4 h-4" />
                Yazdır
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12">
          <div className="max-w-4xl mx-auto bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                 <h1 className="text-3xl font-bold text-gray-900">Gizlilik Politikası</h1>
                 <p className="text-gray-500">Son güncelleme: 12 Ocak 2026</p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-600">
              <p>Beekod ("biz", "bizim"), gizliliğinize önem verir. Bu Gizlilik Politikası, kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.</p>
              
              <h3 className="text-gray-900 font-bold mt-8 mb-4">1. Topladığımız Veriler</h3>
              <p>Hizmetlerimizi kullandığınızda aşağıdaki bilgileri toplayabiliriz:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Hesap bilgileri (isim, e-posta, telefon).</li>
                <li>İşletme bilgileri ve stok verileri.</li>
                <li>Kullanım istatistikleri ve log kayıtları.</li>
              </ul>

              <h3 className="text-gray-900 font-bold mt-8 mb-4">2. Verilerin Kullanımı</h3>
              <p>Verilerinizi şu amaçlarla kullanırız:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Hizmetleri sağlamak ve iyileştirmek.</li>
                <li>Size bildirimler ve güncellemeler göndermek.</li>
                <li>Üçüncü taraf entegrasyonlarını (pazaryerleri) yönetmek.</li>
              </ul>

              <h3 className="text-gray-900 font-bold mt-8 mb-4">3. Veri Paylaşımı</h3>
              <p>Kişisel verilerinizi üçüncü taraflara satmayız. Ancak hizmet sağlayıcılarımızla (hosting, ödeme altyapısı) veya yasal zorunluluk durumunda paylaşabiliriz.</p>

              <h3 className="text-gray-900 font-bold mt-8 mb-4">4. Güvenlik</h3>
              <p>Verilerinizi korumak için endüstri standardı güvenlik önlemleri (SSL, şifreleme) kullanıyoruz.</p>

              <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-400">
                Bu metin örnektir. Yasal bağlayıcılığı yoktur.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
