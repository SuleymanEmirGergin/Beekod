import { useState } from 'react';
import { AppLogo } from './AppLogo';
import { Input } from './Input';
import { Button } from './Button';
import { Mail, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';

interface ForgotPasswordScreenProps {
    onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate email sending
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
                    className="flex items-center gap-2 text-sm text-[#F5B800] hover:text-[#E5A800] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Giriş Sayfasına Dön
                </button>
            </header>

            {/* Main content */}
            <div className="relative z-10 flex items-center justify-center px-4 pt-8 pb-24">
                <div className="w-full max-w-md">
                    {/* Forgot Password card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
                        {!isSubmitted ? (
                            <>
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-[#F5B800] rounded-3xl mb-4">
                                        <AppLogo size={56} />
                                    </div>
                                    <h1 className="text-3xl text-gray-900 mb-2">Şifre Sıfırlama</h1>
                                    <p className="text-sm text-gray-600">
                                        E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <Input
                                        label="İş E-postası"
                                        type="email"
                                        placeholder="isim@sirket.com"
                                        icon={<Mail className="w-5 h-5" />}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />

                                    <Button type="submit" fullWidth>
                                        Sıfırlama Bağlantısı Gönder
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <button
                                        onClick={onBack}
                                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Giriş ekranına dön
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-3xl mb-4">
                                        <CheckCircle2 className="w-16 h-16 text-green-600" />
                                    </div>
                                    <h1 className="text-3xl text-gray-900 mb-2">E-posta Gönderildi!</h1>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Şifre sıfırlama bağlantısını <strong>{email}</strong> adresine gönderdik.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 mb-6">
                                    <h3 className="text-sm text-gray-900 mb-2">📧 E-postanızı kontrol edin</h3>
                                    <ul className="text-xs text-gray-600 space-y-1.5">
                                        <li>• Gelen kutunuzu kontrol edin</li>
                                        <li>• Spam/gereksiz klasörünü kontrol edin</li>
                                        <li>• Bağlantı 24 saat boyunca geçerlidir</li>
                                        <li>• E-posta 5-10 dakika içinde ulaşacaktır</li>
                                    </ul>
                                </div>

                                <Button
                                    onClick={onBack}
                                    fullWidth
                                    variant="secondary"
                                >
                                    Giriş Ekranına Dön
                                </Button>

                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="text-sm text-[#F5B800] hover:text-[#E5A800] transition-colors"
                                    >
                                        E-posta almadınız mı? Tekrar gönderin
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Help Section */}
                    <div className="mt-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-[#F5B800] flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-gray-900 mb-2">
                                    <strong>Yardıma mı ihtiyacınız var?</strong>
                                </p>
                                <p className="text-xs text-gray-600">
                                    Hesabınıza erişimde sorun yaşıyorsanız, destek ekibimiz size yardımcı olmaktan memnuniyet duyar.
                                </p>
                                <a
                                    href="#"
                                    className="text-xs text-[#F5B800] hover:text-[#E5A800] transition-colors mt-2 inline-block"
                                >
                                    Destek ile İletişime Geç →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
