import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Send,
    X,
    Loader2,
    Package,
    Store,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Phone,
    ChevronDown,
    Sparkles,
    Bot,
    User,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { chatApi, ChatMessage, ChatResponse, ProductCard, WholesalerStockHolder, MarketplaceComparisonCard } from "@/services/chatApi";

// ============================================================
// TYPES
// ============================================================

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    productCards?: ProductCard[];
    wholesalerList?: WholesalerStockHolder[];
    marketplaceComparison?: MarketplaceComparisonCard[];
    confirmationCode?: string;
    confirmationType?: "destructive" | "privacy";
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [importingUrls, setImportingUrls] = useState<Set<string>>(new Set());
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: "Merhaba! 👋 Ben BEEKOD AI asistanınız. Size nasıl yardımcı olabilirim?\n\n🔍 Ürün ara\n💰 Fiyat sorgula\n📦 Stok kontrol\n🏪 Toptancı ağında ara",
                timestamp: new Date(),
            }]);
        }
    }, [isOpen, messages.length]);

    // Send message
    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");

        // Add placeholder assistant message
        const assistantId = `assistant-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: assistantId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
        }]);

        setIsLoading(true);

        try {
            const response = await chatApi.sendMessage({
                sessionId: sessionId || undefined,
                message: userMessage.content,
            });

            if (response.sessionId && !sessionId) {
                setSessionId(response.sessionId);
            }

            setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m,
                content: response.message || "Anladım.",
                productCards: response.productCards,
                wholesalerList: response.wholesalerList,
                marketplaceComparison: response.marketplaceComparison,
                confirmationCode: response.confirmationCode,
                confirmationType: response.confirmationType,
            } : m));

        } catch (error) {
            setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m,
                content: "Bir hata oluştu. Lütfen tekrar deneyin.",
            } : m));
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportProduct = async (url: string) => {
        if (!url || importingUrls.has(url)) return;

        setImportingUrls(prev => new Set(prev).add(url));
        try {
            const res = await chatApi.importProduct(url);

            // Add a confirmation message
            const confirmMessage: Message = {
                id: `import-success-${Date.now()}`,
                role: "assistant",
                content: `✅ **${res.productName || 'Ürün'}** başarıyla içe aktarıldı!\n\n${res.error ? `⚠️ ${res.error}` : 'Mağaza bağlantınıza taslak olarak eklendi.'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, confirmMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: `import-error-${Date.now()}`,
                role: "assistant",
                content: `❌ Ürün içe aktarılamadı: ${error.message || 'Hata'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setImportingUrls(prev => {
                const next = new Set(prev);
                next.delete(url);
                return next;
            });
        }
    };

    const clearChat = () => {
        setMessages([{
            id: `welcome-${Date.now()}`,
            role: "assistant",
            content: "Merhaba! 👋 Sohbet temizlendi. Size nasıl yardımcı olabilirim?\n\n🔍 Ürün ara\n💰 Fiyat sorgula\n📦 Stok kontrol\n🏪 Toptancı ağında ara",
            timestamp: new Date(),
        }]);
        setSessionId(null);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ zIndex: 9999 }}
                    className={cn(
                        "fixed bottom-6 right-6 p-4 rounded-full shadow-2xl",
                        "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600",
                        "hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500",
                        "transition-all duration-300"
                    )}
                >
                    <MessageSquare className="w-6 h-6 text-white" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div
                    style={{ zIndex: 9999 }}
                    className={cn(
                        "fixed bottom-6 right-6",
                        "w-[420px] h-[600px] max-h-[80vh]",
                        "flex flex-col",
                        "bg-slate-900 border-2 border-purple-500/50 rounded-2xl",
                        "shadow-2xl shadow-purple-500/20",
                        "overflow-hidden"
                    )}
                >
                    <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm">BEEKOD AI</h3>
                                    <p className="text-green-400 text-xs flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Gemini 2.0 Flash
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearChat}
                                    disabled={messages.length <= 1 || isLoading}
                                    className="text-slate-400 hover:text-red-400 hover:bg-white/10"
                                    title="Sohbeti Temizle"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                            {messages.length > 0 ? (
                                messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        onImportProduct={handleImportProduct}
                                        importingUrls={importingUrls}
                                    />
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                    Mesajlar yükleniyor...
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex items-center gap-2 text-slate-400">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    </div>
                                    <span className="text-sm">Düşünüyor...</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 shrink-0">
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Mesajınızı yazın..."
                                    disabled={isLoading}
                                    className={cn(
                                        "flex-1 bg-slate-800/50 border-white/10",
                                        "text-white placeholder:text-slate-400",
                                        "focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                                    )}
                                />
                                <Button
                                    onClick={sendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    className={cn(
                                        "bg-gradient-to-r from-violet-600 to-purple-600",
                                        "hover:from-violet-500 hover:to-purple-500",
                                        "disabled:opacity-50"
                                    )}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({
    message,
    onImportProduct,
    importingUrls
}: {
    message: Message;
    onImportProduct?: (url: string) => void;
    importingUrls?: Set<string>;
}) {
    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-2", isUser && "flex-row-reverse")}
        >
            {/* Avatar */}
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isUser
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                    : "bg-gradient-to-br from-violet-500 to-purple-600"
            )}>
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            {/* Content */}
            <div className={cn(
                "max-w-[80%] space-y-2",
                isUser && "items-end"
            )}>
                {/* Text Bubble */}
                <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isUser
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-sm"
                        : "bg-slate-700/50 text-slate-100 rounded-bl-sm"
                )}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Product Cards */}
                {message.productCards && message.productCards.length > 0 && (
                    <ProductCardList
                        products={message.productCards}
                        onImportProduct={onImportProduct}
                        importingUrls={importingUrls}
                    />
                )}

                {/* Wholesaler List */}
                {message.wholesalerList && message.wholesalerList.length > 0 && (
                    <WholesalerList wholesalers={message.wholesalerList} />
                )}

                {/* Marketplace Comparison */}
                {message.marketplaceComparison && message.marketplaceComparison.length > 0 && (
                    <MarketplaceComparison items={message.marketplaceComparison} />
                )}

                {/* Confirmation Badge */}
                {message.confirmationCode && (
                    <ConfirmationBadge
                        code={message.confirmationCode}
                        type={message.confirmationType}
                    />
                )}

                {/* Timestamp */}
                <p className={cn(
                    "text-[10px] text-slate-500",
                    isUser && "text-right"
                )}>
                    {message.timestamp.toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}
                </p>
            </div>
        </motion.div>
    );
}

// ============================================================
// PRODUCT CARD LIST
// ============================================================

function ProductCardList({
    products,
    onImportProduct,
    importingUrls
}: {
    products: ProductCard[];
    onImportProduct?: (url: string) => void;
    importingUrls?: Set<string>;
}) {
    const [expanded, setExpanded] = useState(false);
    const displayProducts = expanded ? products : products.slice(0, 3);
    console.log("ProductCardList rendering:", products);

    return (
        <div className="space-y-2">
            {displayProducts.map((product, index) => (
                <motion.div
                    key={product.barcode || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                        "p-3 rounded-xl",
                        "bg-gradient-to-r from-slate-700/50 to-slate-800/50",
                        "border border-white/5 hover:border-purple-500/30",
                        "transition-all duration-200"
                    )}
                >
                    <div className="flex gap-3">
                        {product.image && (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {product.marketplace && (
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                        product.marketplace === "Trendyol" ? "bg-orange-500/20 text-orange-400" :
                                            product.marketplace === "Hepsiburada" ? "bg-orange-600/20 text-orange-500" :
                                                product.marketplace === "N11" ? "bg-red-500/20 text-red-500" :
                                                    product.marketplace === "Amazon" ? "bg-yellow-500/20 text-yellow-500" :
                                                        "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {product.marketplace}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-sm font-medium text-white truncate">
                                {product.name}
                            </h4>
                            <p className="text-xs text-slate-400">{product.barcode}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-green-400 font-semibold text-sm">
                                    ₺{product.price?.toLocaleString("tr-TR")}
                                </span>
                                {product.stock !== undefined && (
                                    <span className={cn(
                                        "text-xs px-1.5 py-0.5 rounded",
                                        product.stock > 10
                                            ? "bg-green-500/20 text-green-400"
                                            : product.stock > 0
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-red-500/20 text-red-400"
                                    )}>
                                        {product.stock} adet
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => product.url && onImportProduct?.(product.url)}
                            disabled={!product.url || importingUrls?.has(product.url || "")}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            title="Mağazama Ekle"
                        >
                            {importingUrls?.has(product.url || "") ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Store className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </motion.div>
            ))}

            {products.length > 3 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-slate-400 hover:text-white"
                >
                    <ChevronDown className={cn(
                        "w-4 h-4 mr-1 transition-transform",
                        expanded && "rotate-180"
                    )} />
                    {expanded ? "Daha az göster" : `+${products.length - 3} ürün daha`}
                </Button>
            )}
        </div>
    );
}

// ============================================================
// WHOLESALER LIST
// ============================================================

function WholesalerList({ wholesalers }: { wholesalers: WholesalerStockHolder[] }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Package className="w-3.5 h-3.5" />
                <span>Toptancı Ağı Sonuçları</span>
            </div>

            {wholesalers.map((w, index) => (
                <motion.div
                    key={w.wholesalerId || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                        "p-3 rounded-xl",
                        "bg-gradient-to-r from-emerald-900/30 to-teal-900/30",
                        "border border-emerald-500/20"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-white">
                                {w.displayName || `Toptancı #${w.wholesalerId}`}
                            </h4>
                            <p className="text-xs text-slate-400">{w.city}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                w.availability === "VAR"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                            )}>
                                {w.availability}
                            </span>
                            {w.canMessage && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

// ============================================================
// MARKETPLACE COMPARISON
// ============================================================

function MarketplaceComparison({ items }: { items: MarketplaceComparisonCard[] }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Pazaryeri Karşılaştırma</span>
            </div>

            {items.map((item, index) => (
                <motion.div
                    key={item.marketplace || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                        "p-3 rounded-xl flex items-center justify-between",
                        "bg-gradient-to-r from-blue-900/30 to-indigo-900/30",
                        "border border-blue-500/20"
                    )}
                >
                    <div className="flex items-center gap-2">
                        {item.available ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm text-white font-medium">{item.marketplace}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-green-400 font-semibold">
                            ₺{item.price?.toLocaleString("tr-TR")}
                        </span>
                        {item.stock !== undefined && (
                            <span className="text-xs text-slate-400">
                                {item.stock} adet
                            </span>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

// ============================================================
// CONFIRMATION BADGE
// ============================================================

function ConfirmationBadge({
    code,
    type
}: {
    code: string;
    type?: "destructive" | "privacy"
}) {
    const isPrivacy = type === "privacy";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "p-3 rounded-xl text-center",
                isPrivacy
                    ? "bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30"
                    : "bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-500/30"
            )}
        >
            <div className="flex items-center justify-center gap-2 mb-2">
                {isPrivacy ? (
                    <Phone className="w-4 h-4 text-blue-400" />
                ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                )}
                <span className="text-xs text-slate-400">
                    {isPrivacy ? "Telefon Paylaşımı Onayı" : "İşlem Onayı Gerekli"}
                </span>
            </div>
            <div className={cn(
                "font-mono text-lg font-bold px-4 py-2 rounded-lg",
                isPrivacy
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-orange-500/20 text-orange-300"
            )}>
                {isPrivacy ? "PAYLAŞ" : "ONAY"} {code}
            </div>
        </motion.div>
    );
}
