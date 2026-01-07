import { useState } from 'react';
import { register as registerApi } from '../services/auth';
import { AppLogo } from '../components/auth/AppLogo';
import { Input } from '../components/auth/Input';
import { Button } from '../components/auth/Button';
import { Checkbox } from '../components/auth/Checkbox';
import { Mail, Eye, EyeOff, User, Building2, ShieldCheck, Sparkles, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterScreenProps {
    onBack: () => void;
    onRegisterSuccess: () => void;
}

export function RegisterScreen({ onBack, onRegisterSuccess }: RegisterScreenProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        inviteCode: '', // Currently unused in backend but kept for UI
        password: '',
        confirmPassword: '',
        acceptTerms: false
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.acceptTerms) {
            const msg = 'Lütfen kullanım şartlarını kabul edin';
            toast.error(msg);
            setError(msg);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            const msg = 'Şifreler eşleşmiyor';
            toast.error(msg);
            setError(msg);
            return;
        }

        if ((formData.firstName + formData.lastName).length < 2) {
            const msg = 'Ad ve soyad toplamı en az 2 karakter olmalıdır';
            toast.error(msg);
            setError(msg);
            return;
        }

        setIsLoading(true);
        try {
            await registerApi({
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                password: formData.password
            });
            setIsSubmitted(true);
            toast.success('Kayıt başarılı! Lütfen giriş yapın.');
        } catch (error: any) {
            console.error('Registration error:', error);

            let message = 'Kayıt işlemi başarısız oldu.';

            if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
                const errorDetails = error.response.data.details
                    .map((err: any) => `${err.path}: ${err.message}`)
                    .join(', ');
                message = `Doğrulama hatası: ${errorDetails}`;
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error.response?.status === 400) {
                message = 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin (E-posta adresi kullanımda olabilir).';
            }

            toast.error(message);
            setError(message);
        } finally {
            setIsLoading(false);
        }
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
                    disabled={isLoading}
                >
                    Zaten hesabınız var mı? <strong>Giriş Yapın</strong>
                </button>
            </header>

            {/* Main content */}
            <div className="relative z-10 flex items-center justify-center px-4 pt-8 pb-24">
                <div className="w-full max-w-2xl">
                    {!isSubmitted ? (
                        <>
                            {/* Register card */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-[#F5B800] rounded-3xl mb-4">
                                        <AppLogo size={56} />
                                    </div>
                                    <h1 className="text-3xl text-gray-900 mb-2">Hesap Oluşturun</h1>
                                    <p className="text-sm text-gray-600">
                                        Beekod toptan satış platformuna katılın ve AI destekli özelliklerden faydalanın.
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Name fields in a row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Ad"
                                            type="text"
                                            placeholder="Adınız"
                                            icon={<User className="w-5 h-5" />}
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                            disabled={isLoading}
                                        />
                                        <Input
                                            label="Soyad"
                                            type="text"
                                            placeholder="Soyadınız"
                                            icon={<User className="w-5 h-5" />}
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                            disabled={isLoading}
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
                                        disabled={isLoading}
                                    />

                                    <Input
                                        label="İş E-postası"
                                        type="email"
                                        placeholder="isim@sirket.com"
                                        icon={<Mail className="w-5 h-5" />}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={isLoading}
                                    />

                                    <Input
                                        label="Davetiye Kodu"
                                        type="text"
                                        placeholder="Davetiye kodunuzu girin"
                                        icon={<Lock className="w-5 h-5" />}
                                        value={formData.inviteCode}
                                        onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                                        // required removed for public reg simplicity, or keep if business logic requires
                                        disabled={isLoading}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Şifre"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Güçlü bir şifre oluşturun"
                                            icon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            onIconClick={() => setShowPassword(!showPassword)}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            disabled={isLoading}
                                        />
                                        <Input
                                            label="Şifre Tekrar"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Şifrenizi tekrar girin"
                                            icon={showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            onIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Password requirements */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-700 mb-2">Şifre gereksinimleri:</p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            <li className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                En az 8 karakter
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                En az bir büyük harf
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                En az bir rakam
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${formData.password === formData.confirmPassword && formData.password.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                Şifreler eşleşmeli
                                            </li>
                                        </ul>
                                    </div>

                                    <Checkbox
                                        label={
                                            <span className="text-sm text-gray-700">
                                                <a href="#" className="text-[#F5B800] hover:text-[#E5A800]">Kullanım Şartlarını</a> ve{' '}
                                                <a href="#" className="text-[#F5B800] hover:text-[#E5A800]">Gizlilik Politikasını</a> kabul ediyorum
                                            </span>
                                        }
                                        checked={formData.acceptTerms}
                                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                                        disabled={isLoading}
                                    />

                                    <Button type="submit" fullWidth disabled={isLoading} className="flex justify-center items-center gap-2">
                                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-600">
                                        Zaten hesabınız var mı?{' '}
                                        <button
                                            onClick={onBack}
                                            className="text-[#F5B800] hover:text-[#E5A800] transition-colors"
                                            disabled={isLoading}
                                        >
                                            Giriş Yapın
                                        </button>
                                    </p>
                                </div>
                            </div>

                            {/* Info banner */}
                            <div className="mt-6 bg-gradient-to-br from-yellow-50 to-amber-50 border border-[#F5B800]/30 rounded-xl p-5">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-[#F5B800] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm text-gray-900 mb-1">Davetiye Kodu Nasıl Alınır?</h3>
                                        <p className="text-xs text-gray-600 mb-3">
                                            Beekod sadece doğrulanmış toptancılar için kapalı bir platformdur. Davetiye kodu almak için mevcut üyelerden birinden davet talep edebilir veya destek ekibimizle iletişime geçebilirsiniz.
                                        </p>
                                        <a href="#" className="text-xs text-[#F5B800] hover:text-[#E5A800] transition-colors">
                                            Destek Ekibi ile İletişime Geç →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-3xl mb-4">
                                    <CheckCircle2 className="w-16 h-16 text-green-600" />
                                </div>
                                <h1 className="text-3xl text-gray-900 mb-2">Hoş Geldiniz! 🎉</h1>
                                <p className="text-sm text-gray-600 mb-6">
                                    Hesabınız başarıyla oluşturuldu. E-posta adresinizi doğrulamanız gerekiyor.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 mb-6">
                                <h3 className="text-sm text-gray-900 mb-2">📧 E-posta Doğrulama</h3>
                                <p className="text-xs text-gray-600 mb-3">
                                    <strong>{formData.email}</strong> adresine bir doğrulama e-postası gönderdik.
                                </p>
                                <ul className="text-xs text-gray-600 space-y-1.5">
                                    <li>• Gelen kutunuzu kontrol edin</li>
                                    <li>• E-postadaki doğrulama bağlantısına tıklayın</li>
                                    <li>• Bağlantı 48 saat boyunca geçerlidir</li>
                                    <li>• Spam/gereksiz klasörünü kontrol etmeyi unutmayın</li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-[#F5B800]/30 rounded-xl p-5 mb-6">
                                <div className="flex gap-3">
                                    <Sparkles className="w-5 h-5 text-[#F5B800] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm text-gray-900 mb-1">Sırada Ne Var?</h3>
                                        <ul className="text-xs text-gray-600 space-y-1.5">
                                            <li>1. E-posta adresinizi doğrulayın</li>
                                            <li>2. Hesabınız yönetici onayı için incelemeye alınacak</li>
                                            <li>3. Onay sonrası platformun tüm özelliklerine erişebileceksiniz</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={onRegisterSuccess} fullWidth>
                                Giriş Sayfasına Dön
                            </Button>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="text-sm text-[#F5B800] hover:text-[#E5A800] transition-colors"
                                >
                                    E-posta almadınız mı? Tekrar gönderin
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Security badge */}
                    <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-600">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>256-bit SSL Güvenli Bağlantı</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
