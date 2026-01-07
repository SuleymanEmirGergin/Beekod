import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/api';
import { AuditLog } from '../types/audit';
import { Loader2, RefreshCw, ShieldAlert, User, Database, Clock } from 'lucide-react';
import type { FC } from 'react';

interface Props {
    onNavigate: (screen: string) => void;
}

export const AuditLogScreen: FC<Props> = ({ onNavigate }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAuditLogs({ limit: 50, offset: 0 });
            setLogs(response.items);
        } catch (err) {
            setError('Loglar yüklenirken bir hata oluştu veya yetkiniz yok.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
        if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
        if (action.includes('CREATE') || action.includes('REGISTER')) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    };

    const translateAction = (action: string) => {
        const map: Record<string, string> = {
            'CREATE': 'OLUŞTURMA',
            'UPDATE': 'GÜNCELLEME',
            'DELETE': 'SİLME',
            'LOGIN': 'GİRİŞ',
            'LOGOUT': 'ÇIKIŞ',
            'REGISTER': 'KAYIT'
        };
        // Handle composite keys like PRODUCT_CREATE
        const parts = action.split('_');
        const suffix = parts[parts.length - 1];
        return map[suffix] || action;
    };

    const translateEntity = (entity: string) => {
        const map: Record<string, string> = {
            'product': 'Ürün',
            'order': 'Sipariş',
            'user': 'Kullanıcı',
            'settings': 'Ayarlar',
            'auth': 'Kimlik',
            'invoice': 'Fatura'
        };
        return map[entity.toLowerCase()] || entity;
    };

    return (
        <div className="p-6 bg-gray-50/50 dark:bg-[#0B0F19] min-h-screen text-gray-800 dark:text-gray-100 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                            Denetim Kayıtları
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Sistemdeki tüm kullanıcı hareketlerini ve değişiklikleri izleyin.
                        </p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-all text-sm font-medium"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Yenile
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden">
                    {error ? (
                        <div className="p-12 text-center text-red-500">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">{error}</p>
                        </div>
                    ) : loading ? (
                        <div className="p-20 text-center">
                            <Loader2 className="w-10 h-10 mx-auto animate-spin text-indigo-500" />
                            <p className="mt-4 text-gray-400">Loglar taranıyor...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Tarih</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Kullanıcı</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">İşlem</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Hedef</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Detaylar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                Henüz kayıt bulunamadı.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 opacity-70" />
                                                        {formatDate(log.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                            {log.user_name ? log.user_name.charAt(0) : '?'}
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-200">
                                                            {log.user_name || 'Sistem / Anonim'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getActionColor(log.action)}`}>
                                                        {translateAction(log.action)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {translateEntity(log.entity_type)} <span className="text-gray-400 text-xs">#{log.entity_id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <pre className="text-xs bg-gray-50 dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 overflow-x-auto max-w-xs">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
