import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
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
    MessageSquare,
    Trash2,
    ExternalLink
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
    suggestions?: string[];
}

interface AIChatScreenProps {
    onNavigate: (screen: string) => void;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AIChatScreen(props: AIChatScreenProps) {
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

    // Focus input on load
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: "Merhaba! 👋 Ben BEEKOD AI asistanınız. İşletmenizi yönetmenize nasıl yardımcı olabilirim?",
                timestamp: new Date(),
                suggestions: [
                    "📦 Stok Durumu",
                    "💰 Karlılık Analizi",
                    "🏪 Toptancı Bul",
                    "📈 Satış Raporu"
                ]
            }]);
        }
    }, [messages.length]);

    // Send message
    const sendMessage = async (text: string = inputValue) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text.trim(),
            timestamp: new Date(),
        };

        // If triggered via chip, standard state update might lag, so use text directly
        if (text !== inputValue) {
            setInputValue("");
        } else {
            setInputValue("");
        }

        setMessages(prev => [...prev, userMessage]);

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

            // Add a confirmation message to chat
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
                content: `❌ İçe aktarma sırasında hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
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
            content: "Merhaba! 👋 Sohbet temizlendi. Business AI asistanınız olarak size tekrar nasıl yardımcı olabilirim?",
            timestamp: new Date(),
            suggestions: [
                "🔍 iPhone 15 Fiyatları",
                "📦 Stok Durumu",
                "💰 Karlılık Analizi",
                "🏪 Toptancı Bul",
                "📈 Satış Raporu"
            ]
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
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">AI Asistan</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Gemini 2.0 Flash ile güçlendirildi
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-gray-900/50">
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            onSuggestionClick={(suggestion) => sendMessage(suggestion)}
                            onImportProduct={handleImportProduct}
                            importingUrls={importingUrls}
                        />
                    ))}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 text-gray-500"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                            <span className="text-sm font-medium">Beekod AI düşünüyor...</span>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="İşletmenizle ilgili yapmak istediğiniz işlemi yazın..."
                                disabled={isLoading}
                                className={cn(
                                    "w-full h-14 pl-6 pr-4 bg-gray-50 dark:bg-gray-800",
                                    "border-gray-200 dark:border-gray-700 rounded-2xl",
                                    "text-lg text-gray-900 dark:text-white placeholder:text-gray-400",
                                    "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                                    "transition-all"
                                )}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearChat}
                            disabled={messages.length <= 1 || isLoading}
                            className="h-14 w-14 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                            title="Sohbeti Temizle"
                        >
                            <Trash2 className="w-6 h-6" />
                        </Button>
                        <Button
                            onClick={() => sendMessage()}
                            disabled={!inputValue.trim() || isLoading}
                            className={cn(
                                "h-14 px-8 rounded-2xl shadow-lg shadow-purple-500/20",
                                "bg-gradient-to-r from-violet-600 to-purple-600",
                                "hover:from-violet-500 hover:to-purple-500",
                                "disabled:opacity-50 transition-all",
                                "flex items-center gap-2"
                            )}
                        >
                            <span className="font-semibold">Gönder</span>
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({
    message,
    onSuggestionClick,
    onImportProduct,
    importingUrls
}: {
    message: Message;
    onSuggestionClick?: (text: string) => void;
    onImportProduct?: (url: string) => void;
    importingUrls?: Set<string>;
}) {
    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-4", isUser && "flex-row-reverse")}
        >
            {/* Avatar */}
            <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                isUser
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                    : "bg-gradient-to-br from-violet-500 to-purple-600"
            )}>
                {isUser ? (
                    <User className="w-5 h-5 text-white" />
                ) : (
                    <Bot className="w-5 h-5 text-white" />
                )}
            </div>

            {/* Content */}
            <div className={cn(
                "max-w-[85%] space-y-3",
                isUser && "items-end"
            )}>
                {/* Text Bubble */}
                <div className={cn(
                    "px-6 py-4 rounded-3xl text-base leading-relaxed shadow-sm",
                    isUser
                        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tr-sm border border-blue-100 dark:border-blue-900/30"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-gray-700"
                )}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Suggestions Chips */}
                {message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {message.suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800/50 rounded-full text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors shadow-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

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
                    "text-xs text-gray-400",
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
    console.log("AIChatScreen Products:", products);

    return (
        <div className="space-y-3 w-full">
            {displayProducts.map((product, index) => (
                <motion.div
                    key={product.barcode || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                        "p-4 rounded-xl",
                        "bg-white dark:bg-gray-800",
                        "border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800",
                        "shadow-sm hover:shadow-md",
                        "transition-all duration-200"
                    )}
                >
                    <div className="flex gap-4">
                        <ProductImage
                            src={product.image}
                            alt={product.name}
                            url={product.url}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {product.marketplace && (
                                    product.url ? (
                                        <a
                                            href={product.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity flex items-center gap-1",
                                                product.marketplace === "Trendyol" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                                                    product.marketplace === "Hepsiburada" ? "bg-orange-600/10 text-orange-600 dark:text-orange-500" :
                                                        product.marketplace === "N11" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                                                            "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                            )}
                                            title="Ürüne Git"
                                        >
                                            {product.marketplace} <ExternalLink className="w-2 h-2" />
                                        </a>
                                    ) : (
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                            product.marketplace === "Trendyol" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                                                product.marketplace === "Hepsiburada" ? "bg-orange-600/10 text-orange-600 dark:text-orange-500" :
                                                    product.marketplace === "N11" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                                                        "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        )}>
                                            {product.marketplace}
                                        </span>
                                    )
                                )}
                            </div>
                            <a href={product.url} target="_blank" rel="noopener noreferrer" className="block group">
                                <h4 className="text-base font-medium text-gray-900 dark:text-white truncate group-hover:text-purple-600 transition-colors">
                                    {product.name}
                                </h4>
                            </a>
                            <p className="text-sm text-gray-500">{product.barcode}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-green-600 dark:text-green-400 font-bold text-base">
                                    ₺{product.price?.toLocaleString("tr-TR")}
                                </span>
                                {product.stock !== undefined && (
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full font-medium",
                                        product.stock > 10
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : product.stock > 0
                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
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
                            className="self-center text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                            title="Mağazama Ekle"
                        >
                            {importingUrls?.has(product.url || "") ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Store className="w-5 h-5" />
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
                    className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
        <div className="space-y-2 w-full">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
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
                        "p-4 rounded-xl",
                        "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
                        "border border-emerald-100 dark:border-emerald-800"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                {w.displayName || `Toptancı #${w.wholesalerId}`}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{w.city}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold",
                                w.availability === "VAR"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                                {w.availability}
                            </span>
                            {w.canMessage && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-full"
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
        <div className="space-y-2 w-full">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
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
                        "p-4 rounded-xl flex items-center justify-between",
                        "bg-white dark:bg-gray-800",
                        "border border-gray-100 dark:border-gray-700 shadow-sm"
                    )}
                >
                    <div className="flex items-center gap-3">
                        {item.available ? (
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            </div>
                        )}
                        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{item.marketplace}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-green-600 dark:text-green-400 font-bold">
                            ₺{item.price?.toLocaleString("tr-TR")}
                        </span>
                        {item.stock !== undefined && (
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                {item.stock} stok
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
                "p-4 rounded-xl text-center border-l-4 w-full max-w-sm mx-auto my-2",
                isPrivacy
                    ? "bg-blue-50 dark:bg-blue-900/10 border-blue-500"
                    : "bg-orange-50 dark:bg-orange-900/10 border-orange-500"
            )}
        >
            <div className="flex items-center justify-center gap-2 mb-3">
                {isPrivacy ? (
                    <Phone className="w-5 h-5 text-blue-500" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
                <span className={cn(
                    "text-sm font-medium",
                    isPrivacy ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"
                )}>
                    {isPrivacy ? "Telefon Paylaşımı Onayı" : "İşlem Onayı Gerekli"}
                </span>
            </div>
            <div className={cn(
                "font-mono text-xl font-bold px-6 py-3 rounded-lg tracking-wider",
                isPrivacy
                    ? "bg-white dark:bg-blue-900/30 text-blue-600 dark:text-blue-200 border border-blue-100 dark:border-blue-800"
                    : "bg-white dark:bg-orange-900/30 text-orange-600 dark:text-orange-200 border border-orange-100 dark:border-orange-800"
            )}>
                {isPrivacy ? "PAYLAŞ" : "ONAY"} {code}
            </div>
        </motion.div>
    );
}

// ============================================================
// PRODUCT IMAGE COMPONENT (Fallback Logic)
// ============================================================

function ProductImage({ src, alt, url }: { src?: string; alt?: string; url?: string }) {
    const [error, setError] = useState(false);

    // Reset error state if src changes
    useEffect(() => {
        setError(false);
    }, [src]);

    const content = (
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
            {src && !error ? (
                <img
                    key={src}
                    src={src}
                    alt={alt}
                    referrerPolicy="no-referrer"
                    onError={() => setError(true)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[9px] font-bold uppercase text-gray-400">Ürün</span>
                </div>
            )}
        </div>
    );

    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                {content}
            </a>
        );
    }
    return content;
}
