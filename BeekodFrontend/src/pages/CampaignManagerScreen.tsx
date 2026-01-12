import {
  Megaphone,
  Plus,
  BarChart2,
  Users,
  Mail,
  MessageSquare,
  TrendingUp,
  Target,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import { getCampaigns, createCampaign, getCampaignStats, launchCampaign, Campaign } from '../services/campaigns';
import { toast } from 'react-hot-toast';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <span className={`text-sm font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'} bg-green-50 px-2 py-1 rounded-lg`}>
          {change}
        </span>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

interface CampaignManagerScreenProps {
  onNavigate: (screen: string) => void;
}

export function CampaignManagerScreen({ onNavigate }: CampaignManagerScreenProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'create'>('overview');
  const [step, setStep] = useState(1);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    type: 'email' as 'email' | 'sms' | 'push',
    content: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [campaignsData, statsData] = await Promise.all([
            getCampaigns(),
            getCampaignStats()
        ]);
        setCampaigns(campaignsData);
        setStats(statsData);
    } catch (error) {
        console.error("Failed to fetch campaigns", error);
    } finally {
        setLoading(false);
    }
  };

  const handleLaunchCampaign = async (id: number) => {
      try {
          await launchCampaign(id.toString());
          toast.success("Kampanya başlatıldı!");
          fetchData();
      } catch (error) {
          toast.error("Kampanya başlatılamadı");
      }
  };

  const handleCreateSubmit = async () => {
      try {
          await createCampaign({
              name: formData.name,
              type: formData.type,
              audience: formData.target,
              content: formData.content
          });
          toast.success("Kampanya oluşturuldu!");
          setActiveTab('overview');
          setStep(1);
          setFormData({ name: '', target: '', type: 'email', content: '' });
          fetchData();
      } catch (error) {
          toast.error("Kampanya oluşturulamadı");
      }
  };

  const renderCreateWizard = () => (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-100 -z-10"></div>
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex flex-col items-center gap-2 bg-white px-4`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s}
            </div>
            <span className="text-xs font-medium text-gray-500">
              {s === 1 ? 'Hedef Kitle' : s === 2 ? 'İçerik' : 'Özet'}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Kampanya Detayları ve Hedef Kitle</h2>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kampanya Adı</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="Örn: Yaz İndirimi Duyurusu"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => setFormData({...formData, type: 'email'})}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${formData.type === 'email' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <Mail className="w-6 h-6" />
              <span className="font-bold">E-Posta</span>
            </button>
            <button 
                onClick={() => setFormData({...formData, type: 'sms'})}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${formData.type === 'sms' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="font-bold">SMS</span>
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Hedef Kitle Segmenti</label>
            <select 
               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
               value={formData.target}
               onChange={(e) => setFormData({...formData, target: e.target.value})}
            >
              <option value="">Seçiniz</option>
              <option value="vip">VIP Müşteriler (En çok harcama yapanlar)</option>
              <option value="lost">Kaybedilen Müşteriler (90 gündür sipariş yok)</option>
              <option value="all">Tüm Kayıtlı Kullanıcılar</option>
            </select>
          </div>

          <button 
             onClick={() => setStep(2)}
             disabled={!formData.name || !formData.target}
             className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Devam Et
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">İçerik Oluşturucu</h2>
            <button className="flex items-center gap-2 text-sm text-purple-600 font-bold bg-purple-50 px-3 py-1.5 rounded-lg">
               <Target className="w-4 h-4" /> AI ile Yaz
            </button>
          </div>
          
          <textarea 
            className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder="Kampanya mesajınızı buraya yazın..."
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
          ></textarea>

          <div className="flex gap-4">
            <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
                Geri
            </button>
            <button 
                onClick={() => setStep(3)}
                disabled={!formData.content}
                className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
                İncele
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8">
           <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Her Şey Hazır!</h2>
              <p className="text-gray-500 mt-2">Kampanyanızı yayınlamadan önce son kontrolleri yapın.</p>
           </div>

           <div className="bg-gray-50 p-6 rounded-xl space-y-4">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                 <span className="text-gray-500">Kampanya Adı</span>
                 <span className="font-bold text-gray-900">{formData.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                 <span className="text-gray-500">Tür</span>
                 <span className="font-bold text-gray-900 uppercase">{formData.type}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                 <span className="text-gray-500">Hedef Kitle</span>
                 <span className="font-bold text-gray-900">{formData.target === 'vip' ? 'VIP Müşteriler' : formData.target}</span>
              </div>
              <div className="pt-2">
                 <span className="text-gray-500 block mb-2">Mesaj Önizleme</span>
                 <p className="text-gray-800 italic bg-white p-4 rounded-lg border border-gray-200">
                    "{formData.content}"
                 </p>
              </div>
           </div>

           <div className="flex gap-4">
            <button 
                onClick={() => setStep(2)}
                className="flex-1 py-4 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
                Düzenle
            </button>
            <button 
                onClick={handleCreateSubmit}
                className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
            >
                🎉 Kampanyayı Oluştur
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarV2
        activeItem="campaigns"
        userName="Ahmet Yılmaz"
        userEmail="Beekod Admin"
        onNavigate={onNavigate}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kampanya Yönetimi</h1>
                <p className="text-xs text-gray-500 font-medium">Pazarlama ve müşteri etkileşimi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setActiveTab(activeTab === 'overview' ? 'create' : 'overview')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
               >
                 {activeTab === 'overview' ? <><Plus className="w-4 h-4" /> Yeni Kampanya</> : 'İptal'}
               </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
            {activeTab === 'create' ? renderCreateWizard() : (
               <>
                 {/* Stats Row */}
                 <div className="grid grid-cols-4 gap-6 mb-8">
                   <StatCard 
                     title="Toplam Erişim" 
                     value={stats?.total_sent ? stats.total_sent.toLocaleString() : '0'} 
                     change="+12%" 
                     trend="up" 
                     icon={Users} 
                     color="text-blue-600" 
                   />
                   <StatCard 
                     title="Aktif Kampanyalar" 
                     value={stats?.active_campaigns ? stats.active_campaigns.toString() : '0'} 
                     change="Aktif" 
                     trend="up" 
                     icon={Megaphone} 
                     color="text-purple-600" 
                   />
                    <StatCard 
                     title="Dönüşüm Oranı" 
                     value="3.2%" 
                     change="+0.4%" 
                     trend="up" 
                     icon={TrendingUp} 
                     color="text-green-600" 
                   />
                    <StatCard 
                     title="Tahmini Gelir" 
                     value={`₺${stats?.total_revenue ? stats.total_revenue.toLocaleString() : '0'}`} 
                     change="+8%" 
                     trend="up" 
                     icon={BarChart2} 
                     color="text-amber-600" 
                   />
                 </div>

                 <h2 className="text-lg font-bold text-gray-900 mb-4">Son Kampanyalar</h2>
                 <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {campaigns.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Henüz kampanya bulunmuyor.</div>
                    ) : (
                        <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Kampanya Adı</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Durum</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Tarih</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">Erişim</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {campaigns.map((camp) => (
                            <tr key={camp.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                    {camp.type === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                                    </div>
                                    <span className="font-bold text-gray-900">{camp.name}</span>
                                </div>
                                </td>
                                <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold 
                                    ${camp.status === 'active' ? 'bg-green-100 text-green-700' : 
                                    camp.status === 'completed' ? 'bg-gray-100 text-gray-600' : 
                                    'bg-yellow-50 text-yellow-700'}`}>
                                    {camp.status === 'active' ? 'Aktif' : camp.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                                </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-600 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    {new Date(camp.created_at).toLocaleDateString("tr-TR")}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                                    {camp.stats_sent?.toLocaleString() || '-'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    {camp.status === 'draft' && (
                                        <button 
                                            onClick={() => handleLaunchCampaign(camp.id)}
                                            className="text-purple-600 hover:text-purple-800 font-bold text-sm bg-purple-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Başlat
                                        </button>
                                    )}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                 </div>
               </>
            )}
        </main>
      </div>
    </div>
  );
}
