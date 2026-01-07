import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/auth';
import { AppLogo } from '../components/auth/AppLogo';
import { Input } from '../components/auth/Input';
import { Button } from '../components/auth/Button';
import { Checkbox } from '../components/auth/Checkbox';
import { Mail, Eye, EyeOff, Lock, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { ForgotPasswordScreen } from '../components/auth/ForgotPasswordScreen';
import { RegisterScreen } from './RegisterScreen';
import { AccessRequestScreen } from '../components/auth/AccessRequestScreen';
import { SupportModal } from '../components/auth/SupportModal';
import { toast } from 'sonner';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Lütfen e-posta ve şifrenizi girin');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginApi({ email, password });
      login(response);
      toast.success('Giriş başarılı');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />;
  }

  if (showRegister) {
    return <RegisterScreen onBack={() => setShowRegister(false)} onRegisterSuccess={() => setShowRegister(false)} />;
  }

  if (showAccessRequest) {
    return <AccessRequestScreen onBack={() => setShowAccessRequest(false)} />;
  }

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
          onClick={() => setShowSupport(true)}
          className="text-sm text-[#F5B800] hover:text-[#E5A800] transition-colors"
        >
          İletişim & Destek
        </button>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center px-4 pt-8 pb-24">
        <div className="w-full max-w-md">
          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-[#F5B800] rounded-3xl mb-4">
                <AppLogo size={56} />
              </div>
              <h1 className="text-3xl text-gray-900 mb-2">Hoş Geldiniz</h1>
              <p className="text-sm text-gray-600">
                Toptan satış operasyonlarınızı, stoklarınızı ve AI içgörülerinizi yönetin.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                label="İş E-postası"
                type="email"
                placeholder="isim@sirket.com"
                icon={<Mail className="w-5 h-5" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />

              <Input
                label="Şifre"
                type={showPassword ? 'text' : 'password'}
                placeholder="Şifrenizi girin"
                icon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                onIconClick={() => setShowPassword(!showPassword)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              <div className="flex items-center justify-between">
                <Checkbox label="Beni hatırla" disabled={isLoading} />
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-[#F5B800] hover:text-[#E5A800] transition-colors"
                  disabled={isLoading}
                >
                  Şifremi unuttum
                </button>
              </div>

              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Giriş Yapılıyor...
                  </span>
                ) : (
                  'Giriş Yap'
                )}
              </Button>
            </form>

            <div className="mt-4">
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowRegister(true)} disabled={isLoading}>
                Kayıt Ol
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-400">Kapalı Ağ Erişimi</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Invite-only section */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-[#F5B800]/30 rounded-xl p-5">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-[#F5B800] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-900 mb-1">Sadece Davetiye ile Platform</h3>
                  <p className="text-xs text-gray-600">
                    Beekod, doğrulanmış toptancılar için kapalı bir ağdır. Tedarikçi veya perakendeci iseniz, lütfen aşağıdan erişim talep edin.
                  </p>
                </div>
              </div>
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowAccessRequest(true)} disabled={isLoading}>
                Erişim Talep Et
              </Button>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-600">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>256-bit SSL Güvenli Bağlantı</span>
          </div>

          {/* AI Features Banner */}
          <div className="mt-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#F5B800]" />
              <div className="flex-1">
                <p className="text-xs text-gray-900">
                  <strong>AI destekli platform:</strong> Fiyat optimizasyonu, stok tahmini ve otomatik yeniden sipariş önerileri
                </p>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Gizlilik Politikası
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Hizmet Şartları
            </a>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
    </div>
  );
}
