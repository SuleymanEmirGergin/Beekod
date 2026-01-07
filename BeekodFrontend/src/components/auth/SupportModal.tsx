import { X, Mail, Phone, MessageCircle, Clock, HelpCircle, FileText, ExternalLink } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface SupportModalProps {
    onClose: () => void;
}

export function SupportModal({ onClose }: SupportModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-br from-[#F5B800] to-[#E5A800] p-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                                <AppLogo size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl text-white">İletişim & Destek</h2>
                                <p className="text-sm text-white/90">Size nasıl yardımcı olabiliriz?</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Quick Contact Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <a
                            href="mailto:destek@beekod.com"
                            className="flex items-start gap-4 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 bg-[#F5B800] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm text-gray-900 mb-1 group-hover:text-[#E5A800] transition-colors">E-posta Desteği</h3>
                                <p className="text-xs text-gray-600 mb-1">destek@beekod.com</p>
                                <p className="text-xs text-gray-500">24 saat içinde yanıt</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>

                        {/* Phone */}
                        <a
                            href="tel:+908501234567"
                            className="flex items-start gap-4 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 bg-[#F5B800] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Phone className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm text-gray-900 mb-1 group-hover:text-[#E5A800] transition-colors">Telefon Desteği</h3>
                                <p className="text-xs text-gray-600 mb-1">0850 123 45 67</p>
                                <p className="text-xs text-gray-500">Haftaiçi 09:00 - 18:00</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>

                        {/* WhatsApp */}
                        <a
                            href="https://wa.me/908501234567"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-4 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 bg-[#F5B800] rounded-lg flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm text-gray-900 mb-1 group-hover:text-[#E5A800] transition-colors">WhatsApp Desteği</h3>
                                <p className="text-xs text-gray-600 mb-1">+90 850 123 45 67</p>
                                <p className="text-xs text-gray-500">Anında destek</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>

                        {/* Working Hours */}
                        <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                            <div className="w-10 h-10 bg-[#E5A800] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm text-gray-900 mb-1">Çalışma Saatleri</h3>
                                <p className="text-xs text-gray-600 mb-1">Pazartesi - Cuma</p>
                                <p className="text-xs text-gray-500">09:00 - 18:00 (GMT+3)</p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="border-t pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <HelpCircle className="w-5 h-5 text-[#F5B800]" />
                            <h3 className="text-sm text-gray-900">Sık Sorulan Sorular</h3>
                        </div>
                        <div className="space-y-3">
                            <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                    <span className="text-sm text-gray-900">Platforma nasıl kayıt olabilirim?</span>
                                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <p className="text-xs text-gray-600 mt-2 px-3 pb-3">
                                    Beekod kapalı bir platformdur. Mevcut bir üyeden davet kodu almanız veya "Erişim Talep Et" butonundan başvuru yapmanız gerekmektedir. Başvurunuz 2-3 iş günü içinde değerlendirilecektir.
                                </p>
                            </details>

                            <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                    <span className="text-sm text-gray-900">Davetiye kodumu nasıl kullanırım?</span>
                                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <p className="text-xs text-gray-600 mt-2 px-3 pb-3">
                                    Login ekranından "Kayıt Ol" butonuna tıklayın. Kayıt formunda davetiye kodu alanına size gönderilen kodu girin. Form tamamlandıktan sonra e-posta adresinizi doğrulamanız gerekecektir.
                                </p>
                            </details>

                            <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                    <span className="text-sm text-gray-900">Şifremi unuttum, ne yapmalıyım?</span>
                                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <p className="text-xs text-gray-600 mt-2 px-3 pb-3">
                                    Login ekranında "Şifremi Unuttum" bağlantısına tıklayın. E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz. Bağlantı 1 saat süreyle geçerlidir.
                                </p>
                            </details>

                            <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                    <span className="text-sm text-gray-900">Platform ücreti nedir?</span>
                                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <p className="text-xs text-gray-600 mt-2 px-3 pb-3">
                                    Beekod temel özellikleri ücretsiz sunar. AI destekli özellikler ve gelişmiş analizler için farklı paket seçeneklerimiz bulunmaktadır. Detaylı fiyatlandırma için destek ekibimizle iletişime geçebilirsiniz.
                                </p>
                            </details>

                            <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                    <span className="text-sm text-gray-900">Hangi marketplace entegrasyonları destekleniyor?</span>
                                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <p className="text-xs text-gray-600 mt-2 px-3 pb-3">
                                    Şu anda Trendyol, Hepsiburada, N11, Amazon TR, Çiçeksepeti ve daha fazla marketplace entegrasyonu sunuyoruz. Platform üzerinden tüm satış kanallarınızı tek yerden yönetebilirsiniz.
                                </p>
                            </details>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="border-t pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-[#F5B800]" />
                            <h3 className="text-sm text-gray-900">Kaynaklar</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href="#"
                                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-[#F5B800] hover:bg-yellow-50 transition-all group"
                            >
                                <span className="text-xs text-gray-900 group-hover:text-[#F5B800]">Kullanıcı Kılavuzu</span>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#F5B800]" />
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-[#F5B800] hover:bg-yellow-50 transition-all group"
                            >
                                <span className="text-xs text-gray-900 group-hover:text-[#F5B800]">Video Eğitimler</span>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#F5B800]" />
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-[#F5B800] hover:bg-yellow-50 transition-all group"
                            >
                                <span className="text-xs text-gray-900 group-hover:text-[#F5B800]">API Dokümantasyonu</span>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#F5B800]" />
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-[#F5B800] hover:bg-yellow-50 transition-all group"
                            >
                                <span className="text-xs text-gray-900 group-hover:text-[#F5B800]">Güvenlik Politikası</span>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#F5B800]" />
                            </a>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
                        <h3 className="text-sm text-gray-900 mb-2">🚨 Acil Durum Desteği</h3>
                        <p className="text-xs text-gray-600 mb-3">
                            Kritik teknik sorunlar veya güvenlik endişeleriniz için 7/24 acil destek hattımız:
                        </p>
                        <a
                            href="tel:+908501234567"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                        >
                            <Phone className="w-4 h-4" />
                            Acil Destek: 0850 123 45 67
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 p-4 rounded-b-2xl">
                    <p className="text-xs text-center text-gray-600">
                        Beekod Toptan Satış Platformu © 2026 • Tüm hakları saklıdır
                    </p>
                </div>
            </div>
        </div>
    );
}
