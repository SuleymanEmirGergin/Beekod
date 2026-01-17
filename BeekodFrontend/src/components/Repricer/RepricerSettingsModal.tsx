import React, { useEffect, useState } from 'react';
import { X, Save, Bot, TrendingDown, Target, ShieldCheck, Play, Pause, AlertTriangle } from 'lucide-react';
import { getRepricerConfig, updateRepricerConfig, runRepricerManual } from '../../services/repricerService';
import { PricingStrategy, RepricingConfig } from '../../types/repricer';

interface Props {
  barcode: string;
  productName: string;
  costPrice?: number;
  currentPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

const STRATEGIES = [
  {
    id: PricingStrategy.MATCH_COMPETITOR,
    title: 'Rekabetçi (Eşleş)',
    desc: 'En düşük fiyatla birebir aynı ol.',
    icon: Target,
    color: 'bg-blue-500',
    bg: 'bg-blue-50 border-blue-200'
  },
  {
    id: PricingStrategy.BEAT_COMPETITOR,
    title: 'Savaşçı (Kır)',
    desc: 'Rakipten belirlediğin miktar kadar ucuza sat.',
    icon: TrendingDown,
    color: 'bg-orange-500',
    bg: 'bg-orange-50 border-orange-200'
  },
  {
    id: PricingStrategy.PROFIT_MAXIMIZER,
    title: 'Tüccar (Kâr Et)',
    desc: 'En düşük sensen fiyatı artırarak kârı maksimize et.',
    icon: Bot,
    color: 'bg-green-500',
    bg: 'bg-green-50 border-green-200'
  }
];

export const RepricerSettingsModal: React.FC<Props> = ({ barcode, productName, costPrice = 0, currentPrice, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  
  const [config, setConfig] = useState<RepricingConfig>({
    barcode,
    enabled: false,
    min_price: costPrice * 1.15, // Default cost + 15%
    max_price: currentPrice * 1.5,
    strategy: PricingStrategy.MATCH_COMPETITOR,
    beat_amount: 1.0,
    target_margin: 0.15
  });

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen, barcode]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await getRepricerConfig(barcode);
      if (res.ok) {
        setConfig(res.value);
      }
    } catch (error) {
      console.error('Failed to load repricer config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (config.min_price < costPrice) {
        if (!confirm('Min fiyat maliyetin altında! Zararına satışa izin veriyor musunuz?')) {
          setSaving(false);
          return;
        }
      }
      await updateRepricerConfig(barcode, config);
      onClose();
    } catch (error) {
      alert('Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await runRepricerManual(barcode);
      alert('Repricer tetiklendi! Fiyatlar kısa süre içinde güncellenecektir.');
    } catch (e) {
      alert('Çalıştırılamadı');
    } finally {
      setRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 transform transition-all animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 p-6 flex justify-between items-start text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-medium text-indigo-300 uppercase tracking-widest">AI Pilot</h2>
            </div>
            <h3 className="text-xl font-bold truncate max-w-md">{productName}</h3>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
              Barcode: {barcode} 
              {costPrice > 0 && <span className="bg-gray-700 px-2 py-0.5 rounded text-xs">Maliyet: {costPrice}₺</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Enable Switch */}
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${config.enabled ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${config.enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                    {config.enabled ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Otonom Fiyatlandırma</h4>
                    <p className="text-sm text-gray-500">{config.enabled ? 'Sistem aktif ve rakipleri izliyor.' : 'Sistem durduruldu.'}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={config.enabled} onChange={(e) => setConfig({...config, enabled: e.target.checked})} />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              {/* Strategies */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Savaş Stratejisi</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {STRATEGIES.map((s) => (
                    <div 
                      key={s.id}
                      onClick={() => setConfig({...config, strategy: s.id as any})}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${config.strategy === s.id ? `${s.bg} border-current ring-2 ring-offset-2 ring-transparent` : 'border-gray-100 hover:border-gray-200'}`}
                      style={{ borderColor: config.strategy === s.id ? '' : undefined }}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white ${s.color}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <h5 className="font-bold text-gray-900 mb-1">{s.title}</h5>
                      <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {config.strategy === PricingStrategy.BEAT_COMPETITOR && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl animate-fade-in-up">
                  <label className="block text-sm font-medium text-orange-900 mb-2">Ne kadar fiyat kıracaksın?</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={config.beat_amount}
                      onChange={(e) => setConfig({...config, beat_amount: Number(e.target.value)})}
                      className="block w-full pl-3 pr-10 py-3 text-orange-900 bg-white border-orange-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      step="0.10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-orange-500 font-bold">TL</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-orange-600">Örn: En ucuz rakip 100 TL ise, senin fiyatın 99 TL olur.</p>
                </div>
              )}

              {/* Guardrails */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  <ShieldCheck className="w-4 h-4" /> Güvenlik Sınırları (Guardrails)
                </h4>
                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Fiyat</label>
                    <div className="relative rounded-md shadow-sm">
                      <input 
                        type="number" 
                        value={config.min_price}
                        onChange={(e) => setConfig({...config, min_price: Number(e.target.value)})}
                        className={`block w-full pr-10 py-2.5 sm:text-sm rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 ${config.min_price < costPrice ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' : ''}`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">TL</span>
                      </div>
                    </div>
                    {config.min_price < costPrice && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Zararına satış riski!
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Fiyat</label>
                    <div className="relative rounded-md shadow-sm">
                      <input 
                        type="number" 
                        value={config.max_price} 
                        onChange={(e) => setConfig({...config, max_price: Number(e.target.value)})}
                        className="block w-full pr-10 py-2.5 sm:text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">TL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
          <button 
            type="button" 
            onClick={handleRunNow}
            disabled={running}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            {running ? <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-gray-600 rounded-full"></div> : <Play className="w-4 h-4" />}
            Şimdi Çalıştır
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all font-medium"
            >
              Vazgeç
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-8 py-2.5 rounded-xl bg-gray-900 text-white shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all font-medium flex items-center gap-2"
            >
              {saving ? '...' : (
                <>
                  <Save className="w-4 h-4" />
                  Kaydet & Başlat
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
