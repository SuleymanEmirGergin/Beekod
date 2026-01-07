import { useState, useEffect } from 'react';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    Search,
    Filter,
    ArrowRight,
    MoreVertical,
    Play,
    Pause,
    Trash2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getJobs, Job, cancelJob } from '../services/jobs';
import { toast } from 'sonner';

export function JobMonitoringScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'completed' | 'failed'>('all');

    const loadJobs = async () => {
        try {
            const data = await getJobs();
            setJobs(data);
        } catch (error) {
            toast.error('İş listesi yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
        const interval = setInterval(loadJobs, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleCancel = async (id: string) => {
        try {
            await cancelJob(id);
            toast.success('İş iptal edildi');
            loadJobs();
        } catch (error) {
            toast.error('İş iptal edilemedi');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'running': return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
            default: return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.type.toLowerCase().includes(searchTerm.toLowerCase()) || job.id.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex h-screen bg-[#FDFCF9]">
            <SidebarV2 activeItem="jobs" onNavigate={onNavigate} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 font-display">İşlem İzleme</h1>
                            <p className="text-xs text-gray-500 font-medium">Arka plandaki görevleri takip edin.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={loadJobs} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-400">AKTİF İŞLER</p>
                                <Activity className="w-5 h-5 text-blue-500" />
                            </div>
                            <p className="text-3xl font-black text-gray-900 mt-2">
                                {jobs.filter(j => j.status === 'running').length}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-400">TAMAMLANAN (BUGÜN)</p>
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <p className="text-3xl font-black text-gray-900 mt-2">
                                {jobs.filter(j => j.status === 'completed').length}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-400">HATALI İŞLER</p>
                                <XCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <p className="text-3xl font-black text-gray-900 mt-2">
                                {jobs.filter(j => j.status === 'failed').length}
                            </p>
                        </div>
                    </div>

                    {/* Job List */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="İşlem ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'running', 'completed', 'failed'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s as any)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === s
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {s === 'all' ? 'TÜMÜ' :
                                            s === 'running' ? 'ÇALIŞIYOR' :
                                                s === 'completed' ? 'TAMAMLANDI' : 'HATALI'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            <AnimatePresence>
                                {filteredJobs.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                        <Activity className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="font-medium">Kayıtlı işlem bulunamadı.</p>
                                    </div>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <motion.div
                                            key={job.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-6"
                                        >
                                            <div className="flex items-center gap-5 flex-1">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${job.status === 'completed' ? 'bg-green-50' :
                                                    job.status === 'failed' ? 'bg-red-50' :
                                                        'bg-blue-50'
                                                    }`}>
                                                    {getStatusIcon(job.status)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-gray-900">
                                                            {job.type === 'SYNC_PRODUCTS' ? 'Ürün Senkronizasyonu' :
                                                                job.type === 'EXPORT_ORDERS' ? 'Sipariş Dışa Aktarma' :
                                                                    job.type === 'BULK_UPDATE' ? 'Toplu Güncelleme' :
                                                                        job.type}
                                                        </h3>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{job.id}</span>
                                                    </div>
                                                    <div className="mt-2 w-full max-w-md bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className={`h-full ${job.status === 'completed' ? 'bg-green-500' :
                                                                job.status === 'failed' ? 'bg-red-500' :
                                                                    'bg-blue-500'
                                                                }`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(job.progress / job.total) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1 max-w-md">
                                                        <span className="text-[10px] font-medium text-gray-500 uppercase">
                                                            {job.progress} / {job.total} tamamlandı
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-900">
                                                            {Math.round((job.progress / job.total) * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-900">{new Date(job.created_at).toLocaleTimeString()}</p>
                                                <p className="text-[10px] font-medium text-gray-400">{new Date(job.created_at).toLocaleDateString()}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {job.status === 'running' && (
                                                    <button
                                                        onClick={() => handleCancel(job.id)}
                                                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                        title="İptal Et"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
