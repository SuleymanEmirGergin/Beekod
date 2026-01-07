import { X, HelpCircle, CheckCircle, Book, Video, MessageCircle, FileText } from 'lucide-react';

interface HelpContent {
  title: string;
  description: string;
  sections: Array<{
    icon: any;
    title: string;
    content: string;
    steps?: string[];
  }>;
  quickTips?: string[];
  videoUrl?: string;
}

interface HelpModalProps {
  page:
  | 'dashboard'
  | 'inventory'
  | 'integrations'
  | 'orders'
  | 'analytics'
  | 'team'
  | 'configuration'
  | 'ai-chatbot'
  | 'model-designer';
  onClose: () => void;
}

const helpContentMap: Record<string, HelpContent> = {
  dashboard: {
    title: 'Dashboard Kullanım Kılavuzu',
    description: 'Dashboard, işletmenizin genel durumunu tek bakışta görmenizi sağlar.',
    sections: [
      {
        icon: CheckCircle,
        title: 'Metric Kartları',
        content:
          'Üst kısımdaki 4 kartı kullanarak günlük siparişler, düşük stok uyarıları, fiyat değişiklikleri ve senkronizasyon durumunu takip edebilirsiniz.',
        steps: [
          'Herhangi bir karta tıklayarak detaylı bilgilere ulaşabilirsiniz',
          "Bugünün Siparişleri: Günlük siparişlerin listesini gösterir",
          'Düşük Stok Uyarıları: Stok seviyesi düşük ürünleri listeler',
          'Fiyat Değişiklikleri: Bekleyen fiyat güncellemelerini gösterir',
          'Senkronizasyon Durumu: Marketplace bağlantılarınızın durumunu kontrol eder',
        ],
      },
      {
        icon: Book,
        title: 'Hızlı İşlemler',
        content: 'En sık kullanılan işlemlere hızlıca erişim sağlar.',
        steps: [
          'Barkod Tara: Ürün barkodunu tarayarak stok bilgisi alın',
          'Hızlı Stok Girişi: Hızlı stok girişi yapın',
          "Kanalları Senkronize Et: Marketplace'leri manuel olarak senkronize edin",
        ],
      },
      {
        icon: MessageCircle,
        title: 'Son Aktiviteler',
        content: 'Sistemdeki son işlemleri ve değişiklikleri görüntüleyin.',
        steps: [
          'Her aktiviteye tıklayarak detaylı bilgilere ulaşabilirsiniz',
          'Sipariş güncellemeleri, fiyat değişiklikleri ve stok uyarılarını takip edin',
          '"Tümünü gör" butonuyla tüm aktivitelere göz atın',
        ],
      },
      {
        icon: FileText,
        title: 'AI Asistan İpuçları',
        content: 'Yapay zeka destekli öneriler ve tahminler alın.',
        steps: [
          'AI, satış hızınıza göre stok önerileri sunar',
          '"Öneriyi İncele" butonuyla detaylı analizleri görün',
          'Önerilen eylemleri tek tıkla uygulayın',
        ],
      },
    ],
    quickTips: [
      '💡 Üst menüdeki arama çubuğundan ürün, sipariş veya müşteri arayabilirsiniz',
      '🔔 Bildirim ikonuna tıklayarak tüm uyarıları görüntüleyebilirsiniz',
      '🤖 Sağ alttaki AI chatbot ile sorularınızı sorabilirsiniz',
      '📊 Kartlar üzerine geldiğinizde ek bilgiler görünür',
    ],
  },
  inventory: {
    title: 'Envanter Yönetimi Kılavuzu',
    description: 'Tüm ürünlerinizi görüntüleyin, düzenleyin ve stok seviyelerini yönetin.',
    sections: [
      {
        icon: CheckCircle,
        title: 'Ürün Listesi',
        content: 'Tüm ürünlerinizi tek bir yerde görüntüleyin ve yönetin.',
        steps: [
          'Her ürünün SKU, fiyat ve stok bilgilerini görüntüleyin',
          '"Güncelle" butonuyla ürün bilgilerini düzenleyin',
          'Stok seviyesi düşük ürünler sarı arka planla gösterilir',
          'Arama ve filtreleme ile istediğiniz ürünü bulun',
        ],
      },
      {
        icon: Book,
        title: 'Ürün Güncelleme',
        content: 'Ürün bilgilerini hızlıca güncelleyin.',
        steps: [
          'Güncelle butonuna tıklayın',
          'Fiyat veya stok miktarını değiştirin',
          'Değişiklikleri Kaydet ile kaydedin',
          "Değişiklikler otomatik olarak marketplace'lere senkronize edilir",
        ],
      },
      {
        icon: MessageCircle,
        title: 'Low Stock Alert Sistemi',
        content: 'Stok seviyelerini otomatik takip edin.',
        steps: [
          'Her ürün için threshold (eşik) değeri belirleyin',
          'Stok bu değerin altına düştüğünde otomatik uyarı alırsınız',
          'Bildirim menüsünden tüm stok uyarılarını görün',
          'Threshold değerini dilediğiniz zaman değiştirebilirsiniz',
        ],
      },
    ],
    quickTips: [
      '⚡ Toplu işlemler için birden fazla ürünü seçebilirsiniz',
      '🔍 Filtrelerle low stock, high demand veya kategori bazlı arama yapın',
      "📥 Export butonuyla envanterinizi Excel'e aktarabilirsiniz",
      '🔄 Senkronizasyon durumunu marketplace ikonlarından takip edin',
    ],
  },
  integrations: {
    title: 'Marketplace Entegrasyonları',
    description: "Trendyol, Hepsiburada ve diğer marketplace'lere bağlanın.",
    sections: [
      {
        icon: CheckCircle,
        title: 'Bağlantı Kurma',
        content: 'Yeni marketplace hesaplarınızı bağlayın.',
        steps: [
          'Yapılandır butonuna tıklayın',
          'API Anahtarı ve API Gizli Anahtarı bilgilerinizi girin',
          'Bağlantıyı Test Et ile bağlantıyı doğrulayın',
          'Yapılandırmayı Kaydet ile kaydedin',
          'Otomatik senkronizasyon başlayacaktır',
        ],
      },
      {
        icon: Book,
        title: 'Senkronizasyon Ayarları',
        content: 'Otomatik senkronizasyon sıklığını ayarlayın.',
        steps: [
          'Her marketplace için ayrı senkronizasyon süresi belirleyin',
          'Real-time, hourly veya daily seçeneklerinden birini seçin',
          'Manuel senkronizasyon için "Sync Now" butonunu kullanın',
          'Senkronizasyon geçmişini kontrol edin',
        ],
      },
      {
        icon: MessageCircle,
        title: 'Marketplace Yönetimi',
        content: 'Bağlı platformları yönetin.',
        steps: [
          "Connected durumundaki marketplace'leri görüntüleyin",
          'Yeşil nokta = Aktif bağlantı',
          'Kırmızı nokta = Bağlantı hatası',
          'Disconnect ile bağlantıyı kaldırabilirsiniz',
        ],
      },
    ],
    quickTips: [
      '🔐 API bilgilerinizi güvenli bir yerde saklayın',
      '⏰ Yoğun saatlerde manuel senkronizasyon yapmaktan kaçının',
      '📊 Sync Status kartından genel durumu takip edin',
      '🔄 Otomatik senkronizasyon her 1 saatte bir çalışır',
    ],
  },
  orders: {
    title: 'Sipariş Yönetimi',
    description: 'Tüm siparişlerinizi tek yerden yönetin ve takip edin.',
    sections: [
      {
        icon: CheckCircle,
        title: 'Sipariş Listesi',
        content: 'Aktif ve geçmiş siparişleri görüntüleyin.',
        steps: [
          'Sipariş durumlarını filtreleyerek görüntüleyin',
          'Processing, Shipped, Delivered seçenekleri mevcuttur',
          'Her siparişe tıklayarak detayları görün',
          'Müşteri bilgileri ve ürün listesine erişin',
        ],
      },
      {
        icon: Book,
        title: 'Sipariş Detayları',
        content: 'Sipariş bilgilerini görüntüleyin ve güncelleyin.',
        steps: [
          'Müşteri iletişim bilgilerini görün',
          'Teslimat adresini kontrol edin',
          'Kargo takip numarasını ekleyin',
          'Sipariş durumunu güncelleyin',
        ],
      },
    ],
    quickTips: [
      '📦 Toplu kargo etiketi yazdırabilirsiniz',
      '🔍 Sipariş numarası veya müşteri adıyla arama yapın',
      '📧 Müşterilere otomatik durum bildirimleri gönderilir',
      "⏱️ Today's Orders dashboard kartından günlük siparişleri görün",
    ],
  },
  analytics: {
    title: 'Analytics & Raporlama',
    description: 'Satış verilerinizi analiz edin ve raporlar oluşturun.',
    sections: [
      {
        icon: CheckCircle,
        title: 'Satış Grafikleri',
        content: 'Satış trendlerinizi görselleştirin.',
        steps: [
          'Haftalık, aylık veya yıllık veriler görüntüleyin',
          'Grafikler üzerine gelerek detaylı bilgi alın',
          "Farklı marketplace'leri karşılaştırın",
          'Export ile raporları indirin',
        ],
      },
      {
        icon: Book,
        title: 'Performans Metrikleri',
        content: "Önemli KPI'ları takip edin.",
        steps: [
          'Gelir, sipariş sayısı, ortalama sepet değeri',
          'En çok satan ürünleri görün',
          'Müşteri dönüş oranlarını analiz edin',
          'Dönemsel karşılaştırmalar yapın',
        ],
      },
    ],
    quickTips: [
      '📈 Dashboard metric kartları günlük özet sunar',
      '📊 Custom date range ile istediğiniz dönemi seçin',
      '💾 Raporları PDF veya Excel olarak kaydedin',
      '🎯 AI insights ile gelecek tahminleri alın',
    ],
  },
  team: {
    title: 'Takım Yönetimi',
    description: 'Ekip üyelerinizi yönetin ve yetkilendirin.',
    sections: [
      {
        icon: CheckCircle,
        title: 'Kullanıcı Ekleme',
        content: 'Yeni ekip üyeleri ekleyin.',
        steps: [
          'Add Member butonuna tıklayın',
          'Ad, email ve rol bilgilerini girin',
          'Admin, Manager veya Viewer rolü seçin',
          'Davet emaili otomatik olarak gönderilir',
        ],
      },
      {
        icon: Book,
        title: 'Rol Yetkileri',
        content: 'Her rolün farklı erişim seviyeleri vardır.',
        steps: [
          'Admin: Tüm yetkilere sahiptir',
          'Manager: Ürün ve sipariş yönetimi yapabilir',
          'Viewer: Sadece görüntüleme yetkisi vardır',
          'Rolleri istediğiniz zaman değiştirebilirsiniz',
        ],
      },
    ],
    quickTips: [
      "👥 Aktif kullanıcı sayısını sidebar'da görüntüleyin",
      '🔐 Her kullanıcı kendi şifresiyle giriş yapar',
      '📧 Kullanıcılar davet emailinden kayıt olur',
      '⚙️ Kullanıcı aktivitelerini loglardan takip edin',
    ],
  },
  configuration: {
    title: 'Sistem Ayarları',
    description: 'Platform ayarlarınızı özelleştirin.',
    sections: [
      {
        icon: CheckCircle,
        title: 'Genel Ayarlar',
        content: 'Platform genelindeki ayarları yapılandırın.',
        steps: [
          'Company Name: Şirket adınızı girin',
          'Timezone: Saat dilimini ayarlayın',
          'Currency: Para biriminizi seçin',
          'Language: Dil tercihini belirleyin',
        ],
      },
      {
        icon: Book,
        title: 'Bildirim Ayarları',
        content: 'Hangi bildirimleri almak istediğinizi seçin.',
        steps: [
          'Email bildirimleri açın/kapatın',
          'Low stock alert eşiklerini belirleyin',
          'Price change onaylarını aktifleştirin',
          'Order status güncellemelerini alın',
        ],
      },
      {
        icon: MessageCircle,
        title: 'API Ayarları',
        content: 'Harici entegrasyonlar için API anahtarları oluşturun.',
        steps: [
          'Generate API Key butonuna tıklayın',
          "API Key'i güvenli bir yerde saklayın",
          "Webhook URL'lerini yapılandırın",
          'Rate limits ve izinleri ayarlayın',
        ],
      },
    ],
    quickTips: [
      '🔒 API anahtarlarını asla paylaşmayın',
      '📧 Test email göndererek bildirimleri kontrol edin',
      '🌍 Timezone ayarı tüm raporlara yansır',
      '💾 Değişiklikleri kaydetmeyi unutmayın',
    ],
  },
  'ai-chatbot': {
    title: 'AI Asistan Kullanımı',
    description: 'Yapay zeka asistanınız ile işlerinizi optimize edin.',
    sections: [
      {
        icon: CheckCircle,
        title: 'AI Yetenekleri',
        content: 'AI asistanınız size birçok konuda yardımcı olabilir.',
        steps: [
          'Satış tahminleri ve talep analizi yapın',
          'Akıllı stok yönetimi önerileri alın',
          'Dinamik fiyatlandırma tavsiyeleri edinin',
          'Doğal dilde soru sorarak anlık içgörüler alın',
        ],
      },
      {
        icon: Book,
        title: 'AI Ayarları',
        content: 'Yapay zeka tercihlerinizi özelleştirin.',
        steps: [
          'Auto Suggestions: Otomatik öneriler alın',
          'Price Optimization: Fiyat optimizasyonu ipuçları',
          'Inventory Alerts: Düşük stok bildirimleri',
          'Market Analysis: Rakip analizi ve pazar trendleri',
        ],
      },
      {
        icon: MessageCircle,
        title: 'Kullanım İstatistikleri',
        content: 'AI kullanımınızı takip edin.',
        steps: [
          'Aylık sorgu limitinizi görün',
          'Oluşturulan içgörü sayısını izleyin',
          'Yapılan aksiyonları takip edin',
          'Upgrade Plan ile daha fazla özellik edinin',
        ],
      },
    ],
    quickTips: [
      '🤖 AI asistanınız 7/24 aktif ve size yardıma hazır',
      '💡 Start Chat ile doğrudan sohbet edebilirsiniz',
      '📊 View Insights ile tüm AI önerilerini görün',
      '⚙️ Ayarları kaydetmeyi unutmayın',
    ],
  },
  'model-designer': {
    title: 'AI Model Designer Kullanımı',
    description: 'Yapay zeka destekli sanal model tasarımı ile ürünlerinizi görselleştirin.',
    sections: [
      {
        icon: CheckCircle,
        title: 'Model Seçimi',
        content: 'Ürününüze uygun model tipini ve etnisiteyi seçin.',
        steps: [
          'Female veya Male model seçeneklerinden birini seçin',
          'Ethnicity (Irk/Etnisite) seçimini yapın: Caucasian, Asian, African, Latin, Middle Eastern, Mixed',
          'Model veya etnisite değiştirdiğinizde önizleme sıfırlanır',
          'Her kombinasyon farklı hedef kitleler için optimize edilmiştir',
          'Seçilen modele ve etnisiteye sarı kenarlık eklenir',
        ],
      },
      {
        icon: Book,
        title: 'Kıyafet ve Renk Seçimi',
        content: 'Görselleştirmek istediğiniz ürünü ve rengini belirleyin.',
        steps: [
          'Garment listesinden kıyafet kategorisi seçin (T-Shirt, Dress, Jacket vb.)',
          'Renk paletinden istediğiniz rengi seçin',
          'Her değişiklik sonrası "Generate Design" butonu aktif olur',
          'Renk ve kıyafet kombinasyonlarını deneyebilirsiniz',
        ],
      },
      {
        icon: MessageCircle,
        title: 'AI Görsel Oluşturma',
        content: 'NanoBanana AI teknolojisi ile fotorealistik görseller oluşturun.',
        steps: [
          'Model, etnisite, kıyafet ve renk seçimini tamamlayın',
          '"Generate Design with AI" butonuna tıklayın',
          'AI 2-3 saniye içinde görselinizi oluşturacak',
          'Oluşturulan görseli Download butonuyla indirebilirsiniz',
          'Reset butonu ile yeni tasarıma başlayabilirsiniz',
        ],
      },
    ],
    quickTips: [
      '🌍 6 farklı etnik köken seçeneği ile global pazara hitap edin',
      '🎨 Her renk değişikliği yeni bir görsel oluşturur',
      '📸 Download butonuyla görselleri kaydedin',
      "🔄 Reset ile canvas'ı temizleyip yeni tasarıma başlayın",
      '⚡ NanoBanana AI ile saniyeler içinde profesyonel görseller',
      '🛍️ E-ticaret ve pazarlama materyalleri için ideal',
    ],
  },
};

export function HelpModal({ page, onClose }: HelpModalProps) {
  const content = helpContentMap[page] || helpContentMap.dashboard;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl text-gray-900">{content.title}</h3>
              <p className="text-sm text-gray-500">{content.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Sections */}
          <div className="space-y-6 mb-8">
            {content.sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div key={idx} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm text-gray-900 mb-2">{section.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{section.content}</p>

                      {section.steps && (
                        <div className="space-y-2">
                          {section.steps.map((step, stepIdx) => (
                            <div key={stepIdx} className="flex items-start gap-2">
                              <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                                {stepIdx + 1}
                              </div>
                              <p className="text-sm text-gray-700 flex-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Tips */}
          {content.quickTips && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100 rounded-xl p-6">
              <h4 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>Hızlı İpuçları</span>
              </h4>
              <div className="space-y-2">
                {content.quickTips.map((tip, idx) => (
                  <p key={idx} className="text-sm text-gray-700">
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Support Section */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
            <h4 className="text-sm text-gray-900 mb-3">Daha Fazla Yardıma mı İhtiyacınız Var?</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors">
                <Video className="w-4 h-4 text-blue-600" />
                Video Eğitimler
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors">
                <Book className="w-4 h-4 text-blue-600" />
                Dokümantasyon
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors col-span-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                Canlı Destek ile İletişime Geç
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
          >
            Anladım, Başlayalım
          </button>
        </div>
      </div>
    </div>
  );
}
