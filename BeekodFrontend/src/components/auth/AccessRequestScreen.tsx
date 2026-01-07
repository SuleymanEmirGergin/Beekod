import { useState } from 'react';
import { AppLogo } from './AppLogo';
import { Input } from './Input';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Mail, User, Building2, Phone, ShieldCheck, CheckCircle2, Lock, Briefcase, MapPin } from 'lucide-react';

interface AccessRequestScreenProps {
    onBack: () => void;
}

export function AccessRequestScreen({ onBack }: AccessRequestScreenProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        city: '',
        businessType: '',
        message: '',
        acceptTerms: false
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate request submission
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50/30 to-gray-50 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Decorative circles */}
                <div className="absolute top-32 left-48 w-2 h-2 bg-[#F5B800]/40 rounded-full"></div>
                <div className="absolute top-48 left-32 w-3 h-3 bg-[#F5B800]/30 rounded-full"></div>
                <div className="absolute top-64 left-64 w-2 h-2 bg-[#F5B800]/50 rounded-full"></div>
                <div className="absolute top-96 left-24 w-2 h-2 bg-[#F5B800]/40 rounded-full"></div>
                <div className="absolute top-80 left-80 w-3 h-3 bg-[#F5B800]/40 rounded-full"></div>

                {/* Right side nodes */}
                <div className="absolute top-40 right-48 w-2 h-2 bg-[#F5B800]/50 rounded-full"></div>
                <div className="absolute top-56 right-64 w-3 h-3 bg-[#F5B800]/30 rounded-full"></div>
                <div className="absolute top-72 right-32 w-2 h-2 bg-[#F5B800]/40 rounded-full"></div>

                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full">
                    <line x1="12%" y1="20%" x2="16%" y2="30%" stroke="rgba(245,184,0,0.1)" strokeWidth="1" />
                    <line x1="16%" y1="30%" x2="20%" y2="40%" stroke="rgba(245,184,0,0.1)" strokeWidth="1" />
                    <line x1="20%" y1="40%" x2="12%" y2="60%" stroke="rgba(245,184,0,0.1)" strokeWidth="1" />
                </svg>
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-6">
                <div className="flex items-center gap-3">
                    <AppLogo size={52} />
                    <div>
                        <span className="text-2xl text-gray-900">Beekod</span>
                        <p className="text-xs text-gray-500">Toptan Satış Platformu</p>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="text-sm text-[#F5B800] hover:text-[#E5A800] transition-colors"
                >
                    Giriş Sayfasına Dön
                </button>
            </header>

            {/* Main content */}
            <div className="relative z-10 flex items-center justify-center px-4 pt-8 pb-24">
                <div className="w-full max-w-2xl">
                    {!isSubmitted ? (
                        <>
                            {/* Access Request card */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-[#F5B800] rounded-3xl mb-4">
                                        <Lock className="w-12 h-12 text-white" />
                                    </div>
                                    <h1 className="text-3xl text-gray-900 mb-2">Platform Erişim Talebi</h1>
                                    <p className="text-sm text-gray-600">
                                        Beekod toptan satış platformuna erişim için başvurunuzu yapın. Ekibimiz başvurunuzu inceleyecek ve en kısa sürede size dönüş yapacaktır.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Name fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Ad"
                                            type="text"
                                            placeholder="Adınız"
                                            icon={<User className="w-5 h-5" />}
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Soyad"
                                            type="text"
                                            placeholder="Soyadınız"
                                            icon={<User className="w-5 h-5" />}
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <Input
                                        label="Şirket Adı"
                                        type="text"
                                        placeholder="Şirket adınızı girin"
                                        icon={<Building2 className="w-5 h-5" />}
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        required
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="İş E-postası"
                                            type="email"
                                            placeholder="isim@sirket.com"
                                            icon={<Mail className="w-5 h-5" />}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Telefon"
                                            type="tel"
                                            placeholder="+90 5XX XXX XX XX"
                                            icon={<Phone className="w-5 h-5" />}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Şehir"
                                            type="text"
                                            placeholder="Şehir seçin"
                                            icon={<MapPin className="w-5 h-5" />}
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="İş Türü"
                                            type="text"
                                            placeholder="Ör: Giyim, Elektronik"
                                            icon={<Briefcase className="w-5 h-5" />}
                                            value={formData.businessType}
                                            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2">
                                            Mesaj (İsteğe Bağlı)
                                        </label>
                                        <textarea
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent resize-none"
                                            rows={4}
                                            placeholder="İşiniz ve platformu nasıl kullanmak istediğiniz hakkında kısa bilgi verin..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        />
                                    </div>

                                    <Checkbox
                                        label={
                                            <span className="text-sm text-gray-700">
                                                Başvurumu göndererek, bilgilerimin platform erişim değerlendirmesi için kullanılmasını kabul ediyorum.
                                            </span>
                                        }
                                        checked={formData.acceptTerms}
                                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                                    />

                                    <Button type="submit" fullWidth disabled={!formData.acceptTerms}>
                                        Erişim Talebi Gönder
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-600">
                                        Zaten hesabınız var mı?{' '}
                                        <button
                                            onClick={onBack}
                                            className="text-[#F5B800] hover:text-[#E5A800] transition-colors"
                                        >
                                            Giriş Yapın
                                        </button>
                                    </p>
                                </div>
                            </div>

                            {/* Info banner */}
                            <div className="mt-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
                                <h3 className="text-sm text-gray-900 mb-2">📋 Değerlendirme Süreci</h3>
                                <ul className="text-xs text-gray-600 space-y-1.5">
                                    <li>• Başvurunuz 2-3 iş günü içinde değerlendirilir</li>
                                    <li>• Ekibimiz şirket bilgilerinizi doğrular</li>
                                    <li>• Onay durumunuz e-posta ile bildirilir</li>
                                    <li>• Onaylanan başvurular için davetiye kodu gönderilir</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-3xl mb-4">
                                    <CheckCircle2 className="w-16 h-16 text-green-600" />
                                </div>
                                <h1 className="text-3xl text-gray-900 mb-2">Başvurunuz Alındı! 🎉</h1>
                                <p className="text-sm text-gray-600 mb-6">
                                    Erişim talebiniz başarıyla gönderildi. Ekibimiz en kısa sürede başvurunuzu değerlendirecektir.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-[#F5B800]/30 rounded-xl p-5 mb-6">
                                <h3 className="text-sm text-gray-900 mb-2">📧 Sonraki Adımlar</h3>
                                <ul className="text-xs text-gray-600 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#F5B800] mt-0.5">✓</span>
                                        <span><strong>{formData.email}</strong> adresinize onay e-postası gönderdik</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#F5B800] mt-0.5">✓</span>
                                        <span>Başvurunuz 2-3 iş günü içinde değerlendirilecek</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#F5B800] mt-0.5">✓</span>
                                        <span>Onay durumunuz e-posta ile bildirilecek</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#F5B800] mt-0.5">✓</span>
                                        <span>Onaylanan başvurular için giriş bilgileri paylaşılacak</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 mb-6">
                                <h3 className="text-sm text-gray-900 mb-2">💡 Başvuru Referans Bilgileri</h3>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-gray-500">Başvuru No</p>
                                        <p className="text-gray-900">BKD-{Math.floor(Math.random() * 100000)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Tarih</p>
                                        <p className="text-gray-900">{new Date().toLocaleDateString('tr-TR')}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Şirket</p>
                                        <p className="text-gray-900">{formData.company}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">E-posta</p>
                                        <p className="text-gray-900">{formData.email}</p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={onBack} fullWidth>
                                Giriş Sayfasına Dön
                            </Button>

                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-500">
                                    Sorularınız için: <a href="#" className="text-[#F5B800] hover:text-[#E5A800]">destek@beekod.com</a>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Security badge */}
                    <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-600">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>Bilgileriniz güvenli şekilde saklanır</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
