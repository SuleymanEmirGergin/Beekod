import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MoreHorizontal,
  Send,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Video,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { SidebarV2 } from '../layouts/SidebarV2';
import {
  getSocialPosts,
  createSocialPost,
  deleteSocialPost,
  postNow,
  generateSocialContent,
  SocialPost,
} from '../services/social.ts';
import { getInventory, InventoryProduct } from '../services/inventory.ts';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PLATFORMS = [
  { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
  { name: 'TikTok', icon: Video, color: 'text-black', bg: 'bg-gray-100' },
  { name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Twitter', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50' },
  { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
];

export function SocialSchedulerScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const location = useLocation();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  // New Post State
  const [newPost, setNewPost] = useState({
    platform: 'Instagram' as any,
    content: '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    productId: '',
    mediaUrl: '',
  });

  useEffect(() => {
    fetchData();

    // Handle pre-fill from location state
    if (location.state?.prefill) {
      const { prefill } = location.state;
      setNewPost((prev) => ({
        ...prev,
        ...prefill,
      }));
      setIsPostingModalOpen(true);
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [postsData, invData] = await Promise.all([getSocialPosts(), getInventory()]);
      setPosts(postsData);
      setInventory(invData);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content) {
      toast.error('İçerik boş olamaz');
      return;
    }
    try {
      await createSocialPost({
        ...newPost,
        status: 'Scheduled',
      });
      toast.success('Paylaşım planlandı');
      setIsPostingModalOpen(false);
      setNewPost({
        platform: 'Instagram',
        content: '',
        scheduledDate: new Date().toISOString().slice(0, 16),
        productId: '',
        mediaUrl: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Paylaşım planlanırken hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSocialPost(id);
      toast.success('Paylaşım silindi');
      fetchData();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const handlePostNow = async (id: string) => {
    try {
      const success = await postNow(id);
      if (success) {
        toast.success('Şimdi paylaşıldı!');
        fetchData();
      } else {
        toast.error('Paylaşım başarısız oldu');
      }
    } catch (error) {
      toast.error('Hata oluştu');
    }
  };

  const handleGenerateAIContent = async () => {
    if (!newPost.productId) {
      toast.error('Lütfen önce bir ürün seçin');
      return;
    }
    setGeneratingContent(true);
    try {
      const content = await generateSocialContent(newPost.productId, newPost.platform);
      setNewPost((prev) => ({ ...prev, content }));
      toast.success('AI İçerik oluşturuldu!');
    } catch (error) {
      toast.error('AI İçerik oluşturulamadı');
    } finally {
      setGeneratingContent(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <SidebarV2 activeItem="social-scheduler" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-900 font-display">
                Sosyal Medya Planlayıcı
              </h1>
              <p className="text-gray-500 mt-1">İçeriklerinizi planlayın ve otomatik paylaşın</p>
            </div>
            <button
              onClick={() => setIsPostingModalOpen(true)}
              className="bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-yellow-200/50"
            >
              <Plus className="w-5 h-5" />
              Yeni Paylaşım
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar / Timeline View */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Planlanan Paylaşımlar</h2>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-gray-700">
                      {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-yellow-100 border-t-[#F5B800] rounded-full animate-spin" />
                    <p className="text-gray-400 font-medium">Paylaşımlar yükleniyor...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-20 px-8">
                    <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                      <CalendarIcon className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Henüz paylaşım yok</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8">
                      İlk paylaşımınızı oluşturun ve markanızı büyütün.
                    </p>
                    <button
                      onClick={() => setIsPostingModalOpen(true)}
                      className="text-[#F5B800] font-bold hover:underline"
                    >
                      Yeni bir tane oluştur →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => {
                      const platformInfo =
                        PLATFORMS.find((p) => p.name === post.platform) || PLATFORMS[0];
                      const StatusIcon =
                        post.status === 'Posted'
                          ? CheckCircle2
                          : post.status === 'Failed'
                            ? AlertCircle
                            : Clock;
                      const statusColor =
                        post.status === 'Posted'
                          ? 'text-green-600 bg-green-50'
                          : post.status === 'Failed'
                            ? 'text-red-600 bg-red-50'
                            : 'text-blue-600 bg-blue-50';

                      return (
                        <div
                          key={post._id}
                          className="group relative bg-white border border-gray-100 rounded-[24px] p-5 hover:border-yellow-200 hover:shadow-xl hover:shadow-yellow-100/20 transition-all"
                        >
                          <div className="flex items-start gap-5">
                            <div
                              className={`w-14 h-14 rounded-2xl ${platformInfo.bg} flex items-center justify-center ${platformInfo.color} shrink-0`}
                            >
                              <platformInfo.icon className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                  {post.platform}
                                </span>
                                <div
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusColor}`}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {post.status === 'Posted'
                                    ? 'Paylaşıldı'
                                    : post.status === 'Scheduled'
                                      ? 'Bekliyor'
                                      : 'Taslak'}
                                </div>
                              </div>
                              <p className="text-gray-900 font-medium line-clamp-2 mb-3">
                                {post.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                                  {new Date(post.scheduledDate).toLocaleDateString('tr-TR')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  {new Date(post.scheduledDate).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handlePostNow(post._id)}
                                className="p-2.5 hover:bg-yellow-50 rounded-xl transition-colors text-yellow-600 opacity-0 group-hover:opacity-100"
                                title="Şimdi Paylaş"
                              >
                                <Send className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(post._id)}
                                className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-red-500 opacity-0 group-hover:opacity-100"
                                title="Sil"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Stats & Tips */}
            <div className="space-y-8">
              {/* Performance Card */}
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333333] rounded-[32px] p-8 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="text-lg font-bold">Haftalık Özet</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4">
                    <div className="text-2xl font-black mb-1">12</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Paylaşım</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <div className="text-2xl font-black mb-1">2.4k</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Erişim</div>
                  </div>
                </div>
                <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold transition-all">
                  Detaylı Raporu Gör
                </button>
              </div>

              {/* AI Insights */}
              <div className="bg-white rounded-[32px] border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  AI Tavsiyeleri
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <p className="text-sm font-medium text-yellow-800 leading-relaxed">
                      "Takipçileriniz en çok Salı saat 20:00'de aktif. Yeni ürün lansmanını bu saate
                      planlayın."
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-sm font-medium text-blue-800 leading-relaxed">
                      "Video içerikleriniz görsellere göre %45 daha fazla etkileşim alıyor."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal for New Post */}
      <AnimatePresence>
        {isPostingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPostingModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="px-10 py-10">
                <h2 className="text-2xl font-black text-gray-900 mb-8 font-display">
                  Yeni Paylaşım Planla
                </h2>

                <div className="space-y-6">
                  {/* Platform Selection */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                      Platform
                    </label>
                    <div className="flex gap-3">
                      {PLATFORMS.map((platform) => (
                        <button
                          key={platform.name}
                          onClick={() => setNewPost({ ...newPost, platform: platform.name as any })}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${newPost.platform === platform.name
                              ? `${platform.bg} ${platform.color} ring-2 ring-yellow-400`
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                        >
                          <platform.icon className="w-6 h-6" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        İçerik
                      </label>
                      <button
                        onClick={handleGenerateAIContent}
                        disabled={generatingContent}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 disabled:opacity-50"
                      >
                        {generatingContent ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        AI SİHİRBAZI
                      </button>
                    </div>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      rows={4}
                      className="w-full bg-gray-50 border-none rounded-[24px] p-5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-400 transition-all resize-none font-medium mb-4"
                      placeholder="Ne paylaşmak istersiniz?"
                    />

                    {newPost.mediaUrl && (
                      <div className="relative rounded-[24px] overflow-hidden border border-gray-100 bg-gray-50">
                        <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            AI Video Hazır
                          </span>
                        </div>
                        <video
                          src={newPost.mediaUrl}
                          className="w-full h-48 object-cover"
                          autoPlay
                          loop
                          muted
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Scheduled Date */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                        Tarih & Saat
                      </label>
                      <input
                        type="datetime-local"
                        value={newPost.scheduledDate}
                        onChange={(e) => setNewPost({ ...newPost, scheduledDate: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-yellow-400 font-medium"
                      />
                    </div>

                    {/* Product Link (Optional) */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
                        Ürün (Opsiyonel)
                      </label>
                      <select
                        value={newPost.productId}
                        onChange={(e) => setNewPost({ ...newPost, productId: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-yellow-400 font-medium"
                      >
                        <option value="">Seçiniz...</option>
                        {inventory.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      onClick={() => setIsPostingModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={handleCreatePost}
                      className="flex-1 py-4 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-2xl font-bold transition-all shadow-lg shadow-yellow-200/50"
                    >
                      Planla
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
