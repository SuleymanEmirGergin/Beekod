import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Store, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketplaceHealth {
  name: string;
  label: string;
  status: 'online' | 'offline';
  icon?: string;
}

async function getMarketplaceHealth(): Promise<MarketplaceHealth[]> {
  const response = await api.get('/marketplaces/health');
  return response.data.health;
}

export function MarketplaceHealthWidget() {
  const {
    data: health,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['marketplaceHealth'],
    queryFn: getMarketplaceHealth,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !health) return null;

  const onlineCount = health.filter((h) => h.status === 'online').length;
  const totalCount = health.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Pazaryeri Bağlantıları</h3>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
            SİSTEM SAĞLIK DURUMU
          </p>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${onlineCount === totalCount ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
            }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${onlineCount === totalCount ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}
          />
          {onlineCount}/{totalCount} AKTİF
        </div>
      </div>

      <div className="space-y-2">
        {health.map((item) => (
          <div
            key={item.name}
            className="group flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.status === 'online'
                    ? 'bg-white border-green-100'
                    : 'bg-gray-50 border-gray-100'
                  }`}
              >
                <Store
                  className={`w-4 h-4 ${item.status === 'online' ? 'text-green-600' : 'text-gray-300'}`}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{item.label}</p>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[9px] font-bold uppercase ${item.status === 'online' ? 'text-green-500' : 'text-gray-400'
                      }`}
                  >
                    {item.status === 'online' ? 'BAĞLI' : 'YAPILANDIRILMAMIŞ'}
                  </span>
                </div>
              </div>
            </div>
            {item.status === 'online' ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <button className="p-1.5 text-gray-300 hover:text-indigo-600 rounded-lg hover:bg-white transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-3 text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest border border-dashed border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2">
        YENİ KANAL EKLE
      </button>
    </div>
  );
}
