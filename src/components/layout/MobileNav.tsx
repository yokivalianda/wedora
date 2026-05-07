"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FolderKanban, 
  ListTodo, 
  DollarSign, 
  Calendar,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proyek", href: "/projects", icon: FolderKanban },
  { name: "Tugas", href: "/tasks", icon: ListTodo },
  { name: "Keuangan", href: "/budget", icon: DollarSign },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Setelan", href: "/settings", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-[#ECE7E1] bg-white/95 backdrop-blur-md shadow-elevated pb-safe-bottom overflow-hidden">
      <div className="flex h-16 items-center justify-around px-2 relative">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 py-1 h-full text-center focus:outline-none"
            >
              {/* Active Indicator Sliding Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute inset-x-2 top-2 bottom-2 rounded-xl bg-[#FAF7E8] -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center justify-center"
              >
                <item.icon 
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive ? "text-[#D4AF37]" : "text-[#666666]"
                  )} 
                />
                <span 
                  className={cn(
                    "mt-1 text-[9px] font-semibold tracking-wide transition-colors duration-200",
                    isActive ? "text-[#1E1E1E]" : "text-[#666666]"
                  )}
                >
                  {item.name}
                </span>
              </motion.div>

              {/* Little active dot at the bottom */}
              {isActive && (
                <motion.span
                  layoutId="activeDot"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-[#D4AF37]"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

