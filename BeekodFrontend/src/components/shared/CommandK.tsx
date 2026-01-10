import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
    Search,
    LayoutDashboard,
    ShoppingBag,
    Users,
    Settings,
    Package,
    BarChart2,
    Sparkles,
    FileText
} from "lucide-react";

export const CommandK = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in duration-200">
            <Command className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-gray-100 px-4">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <Command.Input
                        placeholder="Ne yapmak istiyorsunuz?"
                        className="w-full h-14 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                    />
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2">
                    <Command.Empty className="py-6 text-center text-sm text-gray-500">
                        Sonuç bulunamadı.
                    </Command.Empty>

                    <Command.Group heading="Sayfalar" className="text-xs font-semibold text-gray-400 mb-2 px-2">
                        <Command.Item
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors aria-selected:bg-gray-100 aria-selected:text-black"
                            onSelect={() => runCommand(() => navigate("/dashboard"))}
                        >
                            <LayoutDashboard size={16} />
                            Dashboard
                        </Command.Item>
                        <Command.Item
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors aria-selected:bg-gray-100 aria-selected:text-black"
                            onSelect={() => runCommand(() => navigate("/orders"))}
                        >
                            <ShoppingBag size={16} />
                            Siparişler
                        </Command.Item>
                        <Command.Item
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors aria-selected:bg-gray-100 aria-selected:text-black"
                            onSelect={() => runCommand(() => navigate("/inventory"))}
                        >
                            <Package size={16} />
                            Envanter
                        </Command.Item>
                        <Command.Item
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors aria-selected:bg-gray-100 aria-selected:text-black"
                            onSelect={() => runCommand(() => navigate("/team"))}
                        >
                            <Users size={16} />
                            Ekip
                        </Command.Item>
                        <Command.Item
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors aria-selected:bg-gray-100 aria-selected:text-black"
                            onSelect={() => runCommand(() => navigate("/analytics"))}
                        >
                            <BarChart2 size={16} />
                            Analitik
                        </Command.Item>
                        <Command.Item
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors aria-selected:bg-gray-100 aria-selected:text-black"
                            onSelect={() => runCommand(() => navigate("/audit-logs"))}
                        >
                            <FileText size={16} />
                            Denetim Kayıtları
                        </Command.Item>
                        <Command.Item
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors aria-selected:bg-gray-100 aria-selected:text-black"
                            onSelect={() => runCommand(() => navigate("/configuration"))}
                        >
                            <Settings size={16} />
                            Ayarlar
                        </Command.Item>
                    </Command.Group>


                </Command.List>

                <div className="border-t border-gray-100 p-2 flex justify-between items-center bg-gray-50 text-[10px] text-gray-400 px-4">
                    <span>Beekod Command Center</span>
                    <div className="flex gap-2">
                        <span>↑↓ ile seç</span>
                        <span>↵ ile git</span>
                    </div>
                </div>
            </Command>
        </div>
    );
};
