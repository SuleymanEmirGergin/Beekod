import { Printer, ArrowLeft } from 'lucide-react';
import { SidebarV2 } from '../layouts/SidebarV2';

interface TermsScreenProps {
  onNavigate: (screen: string) => void;
}

export function TermsScreen({ onNavigate }: TermsScreenProps) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hizmet Şartları</h1>
            <p className="text-gray-500 mb-8">Son güncelleme: 12 Ocak 2026</p>

            <div className="prose prose-lg max-w-none text-gray-600">
              <p>Beekod Toptan Satış Platformu'na ("Platform") hoş geldiniz. Bu Hizmet Şartları ("Şartlar"), Platformu kullanımınızı yönetir.</p>
              
              <h3 className="text-gray-900 font-bold mt-8 mb-4">1. Kabul Edilme</h3>
              <p>Platforma erişerek veya kullanarak, bu Şartlara bağlı kalmayı kabul edersiniz. Bu şartları kabul etmiyorsanız, Platforma erişemezsiniz.</p>

              <h3 className="text-gray-900 font-bold mt-8 mb-4">2. Hesap Güvenliği</h3>
              <p>Hesabınızın güvenliğini sağlamak sizin sorumluluğunuzdadır. Şifrenizi kimseyle paylaşmamalısınız. Hesabınızla yapılan tüm işlemlerden siz sorumlusunuz.</p>

              <h3 className="text-gray-900 font-bold mt-8 mb-4">3. Kullanım Koşulları</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Platformu yasa dışı amaçlarla kullanamazsınız.</li>
                <li>Tedarikçi verilerini izinsiz kopyalayamazsınız.</li>
                <li>Sistemin güvenliğini test etmeye veya ihlal etmeye çalışamazsınız.</li>
              </ul>

              <h3 className="text-gray-900 font-bold mt-8 mb-4">4. Ödemeler ve Abonelikler</h3>
              <p>Bazı özellikler abonelik gerektirebilir. Ödeme koşulları ödeme sayfasında belirtildiği gibidir.</p>

              <h3 className="text-gray-900 font-bold mt-8 mb-4">5. Fesih</h3>
              <p>Beekod, bu şartları ihlal etmeniz durumunda hesabınızı askıya alma veya sonlandırma hakkını saklı tutar.</p>

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
