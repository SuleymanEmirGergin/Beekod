import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile, UserProfile } from '../services/profile';
import { SidebarV2 } from '../layouts/SidebarV2';
import { ChatWidget } from '../components/ChatWidget';
import { Card } from '../components/shared/';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Available accounts/companies
  const [availableAccounts] = useState([
    { id: '1', name: 'Beekod Wholesale', type: 'Ana Hesap', logo: '🏢' },
    { id: '2', name: 'Beekod Automation', type: 'Otomasyon Hesabı', logo: '🤖' },
    { id: '3', name: 'Beekod International', type: 'Uluslararası Hesap', logo: '🌍' },
  ]);

  const [activeAccount, setActiveAccount] = useState(availableAccounts[0]);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  // Profile Data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: activeAccount.name,
    position: 'Kurucu & CEO', // Default until loaded
    location: '',
    joinDate: '',
    bio: '',
  });

  const [editedData, setEditedData] = useState(profileData);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getMyProfile();
      if (user) {
        const newProfile = {
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          company: activeAccount.name, // Hardcoded for now as API doesn't return company yet
          position: user.position || 'Kurucu & CEO',
          location: user.location || '',
          joinDate: new Date(user.joinedAt).toLocaleDateString('tr-TR', {
            month: 'long',
            year: 'numeric',
          }),
          bio: user.bio || '',
        };
        setProfileData(newProfile);
        setEditedData(newProfile);
      }
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(profileData);
  };

  const handleSave = async () => {
    try {
      const updatedUser = await updateMyProfile({
        name: editedData.name,
        email: editedData.email,
        phone: editedData.phone,
        location: editedData.location,
        position: editedData.position,
        bio: editedData.bio,
      });
      setProfileData({
        ...profileData,
        ...editedData, // Keep local fields
        name: updatedUser.name,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save profile', error);
      alert('Failed to save profile');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="profile"
        onNavigate={onNavigate}
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-[#B8934D] hover:text-[#A07D3D] hover:underline"
              >
                Ana Sayfa
              </button>
              <span>/</span>
              <span className="text-gray-900">Profil</span>
            </div>
            <div className="flex items-center gap-4">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Profili Düzenle
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Değişiklikleri Kaydet
                  </button>
                </>
              )}
              <button
                onClick={() => onNavigate('profile')}
                className="w-9 h-9 rounded-full overflow-hidden hover:ring-2 ring-[#F5B800] transition-all"
              >
                <img
                  src="https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMG1hbiUyMHN1aXR8ZW58MXx8fHwxNzY2NzYwMTYyfDA&ixlib=rb-4.1.0&q=80&w=400"
                  alt="Ahmet Yılmaz"
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Save className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-green-900">Profil Başarıyla Güncellendi!</div>
                <div className="text-xs text-green-600">
                  Profil bilgileriniz kaydedildi.
                </div>
              </div>
            </div>
          )}

          <div className="max-w-4xl">
            {/* Profile Header Card */}
            <Card padding="lg" className="mb-6">
              <div className="flex items-start gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src="https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMG1hbiUyMHN1aXR8ZW58MXx8fHwxNzY2NzYwMTYyfDA&ixlib=rb-4.1.0&q=80&w=400"
                      alt="Ahmet Yılmaz"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isEditing && (
                    <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  {!isEditing ? (
                    <>
                      <h1 className="text-2xl text-gray-900 mb-1">{profileData.name}</h1>
                      <p className="text-sm text-gray-600 mb-3">{profileData.position}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{profileData.bio}</p>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={editedData.name}
                        onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                        className="text-2xl text-gray-900 mb-1 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-[#F5B800] w-full"
                      />
                      <input
                        type="text"
                        value={editedData.position}
                        onChange={(e) => setEditedData({ ...editedData, position: e.target.value })}
                        className="text-sm text-gray-600 mb-3 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-[#F5B800] w-full"
                      />
                      <textarea
                        value={editedData.bio}
                        onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                        rows={3}
                        className="text-sm text-gray-500 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#F5B800] w-full resize-none"
                      />
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card padding="lg" className="mb-6">
              <h2 className="text-base text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#F5B800]" />
                İletişim Bilgileri
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-posta Adresi
                  </label>
                  {!isEditing ? (
                    <p className="text-sm text-gray-900">{profileData.email}</p>
                  ) : (
                    <input
                      type="email"
                      value={editedData.email}
                      onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefon Numarası
                  </label>
                  {!isEditing ? (
                    <p className="text-sm text-gray-900">{profileData.phone}</p>
                  ) : (
                    <input
                      type="tel"
                      value={editedData.phone}
                      onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Şirket
                  </label>
                  {!isEditing ? (
                    <p className="text-sm text-gray-900">{profileData.company}</p>
                  ) : (
                    <input
                      type="text"
                      value={editedData.company}
                      onChange={(e) => setEditedData({ ...editedData, company: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Konum
                  </label>
                  {!isEditing ? (
                    <p className="text-sm text-gray-900">{profileData.location}</p>
                  ) : (
                    <input
                      type="text"
                      value={editedData.location}
                      onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#F5B800]"
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* Account Information */}
            <Card padding="lg" className="mb-6">
              <h2 className="text-base text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F5B800]" />
                Hesap Bilgileri
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Üyelik Tarihi</label>
                  <p className="text-sm text-gray-900">{profileData.joinDate}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Hesap Türü</label>
                  <p className="text-sm text-gray-900">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs border border-purple-200">
                      Yönetici
                    </span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Account Switcher */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#F5B800]" />
                  <h2 className="text-base text-gray-900">Hesap Değiştir</h2>
                </div>
                <button
                  onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
                  className="text-sm text-[#B8934D] hover:text-[#A07D3D]"
                >
                  {showAccountSwitcher ? 'Gizle' : 'Tümünü Göster'}
                </button>
              </div>

              {/* Current Account */}
              <div className="p-4 bg-[#F5B800]/10 border-2 border-[#F5B800] rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                      {activeAccount.logo}
                    </div>
                    <div>
                      <div className="text-sm text-gray-900">{activeAccount.name}</div>
                      <div className="text-xs text-gray-500">{activeAccount.type}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#F5B800] text-gray-900 rounded-lg text-xs">
                    Aktif
                  </span>
                </div>
              </div>

              {/* Other Accounts */}
              {showAccountSwitcher && (
                <div className="space-y-2">
                  {availableAccounts
                    .filter((account) => account.id !== activeAccount.id)
                    .map((account) => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setActiveAccount(account);
                          setProfileData({ ...profileData, company: account.name });
                          setShowAccountSwitcher(false);
                        }}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                              {account.logo}
                            </div>
                            <div className="text-left">
                              <div className="text-sm text-gray-900">{account.name}</div>
                              <div className="text-xs text-gray-500">{account.type}</div>
                            </div>
                          </div>
                          <RefreshCw className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>İpucu:</strong> Farklı otomasyon hesaplarınız ve işletmeleriniz arasında geçiş yapın.
                  Tüm verileriniz ve entegrasyonlarınız otomatik olarak senkronize edilir.
                </p>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Floating Chat Button */}
      <ChatWidget />
    </div>
  );
}
