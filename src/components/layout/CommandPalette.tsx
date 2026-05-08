"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  DollarSign,
  Calendar,
  Settings,
  Plus,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { projectService } from "@/lib/services";
import { WeddingProject } from "@/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keydown for closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  interface CommandItem {
    name: string;
    href: string;
    icon: any;
    category: string;
    subtitle?: string;
  }

  // Define command items
  const navigations: CommandItem[] = [
    { name: "Ke Dashboard", href: "/dashboard", icon: LayoutDashboard, category: "Navigasi" },
    { name: "Daftar Proyek Pernikahan", href: "/projects", icon: FolderKanban, category: "Navigasi" },
    { name: "Manajemen Tugas & Checklist", href: "/tasks", icon: ListTodo, category: "Navigasi" },
    { name: "Buku Kas & Keuangan", href: "/budget", icon: DollarSign, category: "Navigasi" },
    { name: "Kalender Event", href: "/calendar", icon: Calendar, category: "Navigasi" },
    { name: "Daftar Rekanan Vendor", href: "/vendors", icon: Sparkles, category: "Navigasi" },
    { name: "Setelan Workspace", href: "/settings", icon: Settings, category: "Navigasi" },
  ];

  const quickActions: CommandItem[] = [
    { name: "Mulai Proyek Baru", href: "/projects", icon: Plus, category: "Aksi Cepat" },
    { name: "Tambah Tugas Baru", href: "/tasks", icon: Plus, category: "Aksi Cepat" },
  ];

  const [projects, setProjects] = useState<WeddingProject[]>([]);

  useEffect(() => {
    projectService.getAll().then(setProjects);
  }, []);

  const projectItems: CommandItem[] = projects.map(proj => ({
    name: `${proj.bride_name} & ${proj.groom_name}`,
    href: `/projects/${proj.id}`,
    icon: Sparkles,
    category: "Proyek Pernikahan",
    subtitle: `${proj.venue} • ${proj.wedding_date}`
  }));

  const allItems: CommandItem[] = [
    ...navigations,
    ...quickActions,
    ...projectItems
  ];

  // Filter items based on query
  const filteredItems = allItems.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  // Handle keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].href);
      }
    }
  };

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  // Group items by category for rendering while keeping continuous index
  const categories = Array.from(new Set(filteredItems.map(i => i.category)));

  // Map each item to its absolute index in filteredItems
  let itemCounter = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop blur overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#ECE7E1] bg-white shadow-elevated"
            onKeyDown={handleKeyDown}
            ref={containerRef}
          >
            {/* Search Input Box */}
            <div className="flex items-center border-b border-[#ECE7E1] px-4 py-3.5">
              <Search className="h-5 w-5 text-[#666666] mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Ketik perintah, nama proyek, atau navigasi..."
                className="w-full bg-transparent text-[#1E1E1E] placeholder-[#666666]/40 focus:outline-none text-sm font-medium"
              />
              <span className="rounded-md border border-[#ECE7E1] bg-[#FAF7F2] px-1.5 py-0.5 text-[10px] font-bold text-[#666666] tracking-wider select-none shrink-0">
                ESC
              </span>
            </div>

            {/* List Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#666666] font-medium">
                  Tidak ditemukan hasil untuk "<span className="italic">{query}</span>"
                </div>
              ) : (
                categories.map((category) => {
                  const categoryItems = filteredItems.filter(i => i.category === category);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                        {category}
                      </div>
                      {categoryItems.map((item) => {
                        const currentGlobalIndex = itemCounter++;
                        const isSelected = currentGlobalIndex === selectedIndex;
                        return (
                          <div
                            key={item.name}
                            onClick={() => handleSelect(item.href)}
                            onMouseEnter={() => setSelectedIndex(currentGlobalIndex)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                              isSelected 
                                ? "bg-[#FAF7E8] text-[#1E1E1E]" 
                                : "text-[#666666] hover:bg-[#FAF7F2]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={`h-4.5 w-4.5 ${isSelected ? "text-[#D4AF37]" : "text-[#666666]"}`} />
                              <div className="text-left">
                                <p className={`text-xs font-semibold ${isSelected ? "text-[#1E1E1E]" : "text-[#1E1E1E]"}`}>
                                  {item.name}
                                </p>
                                {item.subtitle && (
                                  <p className="text-[10px] text-[#666666] mt-0.5">{item.subtitle}</p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <motion.div 
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37]"
                              >
                                <span>Buka</span>
                                <ArrowRight className="h-3 w-3" />
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Keyboard guidance footer */}
            <div className="flex items-center justify-between border-t border-[#ECE7E1] bg-[#FAF7F2] px-4 py-2 text-[10px] text-[#666666] font-medium">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigasi</span>
                <span>↵ Pilih</span>
              </div>
              <div>Wedora Premium Workspace</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
