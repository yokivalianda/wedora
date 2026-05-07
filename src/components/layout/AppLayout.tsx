"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import TopBar from "./TopBar";
import CommandPalette from "./CommandPalette";
import { useAuth } from "@/lib/auth-context";
import { Sparkles } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    // Custom event listener for triggering from other components
    const handleOpenTrigger = () => {
      setIsCommandPaletteOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenTrigger);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenTrigger);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <div className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-white border border-[#ECE7E1] text-[#D4AF37] shadow-card">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-[#1E1E1E]">Memuat Ruang Kerja...</h2>
          <p className="text-xs text-[#666666]">Menyiapkan detail pernikahan Anda dengan penuh keanggunan</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] print:bg-white">
      {/* Sidebar (Desktop) */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen print:pl-0">
        {/* TopBar (Desktop & Mobile) */}
        <div className="print:hidden">
          <TopBar />
        </div>

        {/* Content Box */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto animate-fade-in print:p-0 print:py-0 print:m-0 print:max-w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="print:hidden">
        <MobileNav />
      </div>

      {/* Global Premium Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
}


