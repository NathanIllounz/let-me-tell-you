import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  ChevronDown,
  Shield,
  Database,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfileDropdown({ session, supabase, onShowSettings, onShowUsage }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fullName =
    session?.user?.user_metadata?.full_name || session?.user?.email;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full transition-all shadow-sm group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a174] to-[#8F7C6B] flex items-center justify-center text-white shadow-inner">
          <User className="w-5 h-5" />
        </div>
        <div className="hidden sm:flex flex-col items-start mr-1">
          <span className="text-sm font-bold text-stone-800 leading-none truncate max-w-[120px]">
            {fullName}
          </span>
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
            {session?.user?.user_metadata?.family_status
              ? t(`family_status.${session.user.user_metadata.family_status}`)
              : t("family_status.other")}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-5 bg-stone-50/50 border-b border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">
              {t("profile.title")}
            </p>
            <p className="text-base font-bold text-stone-800 truncate">
              {fullName}
            </p>
            <p className="text-xs text-stone-500 truncate">
              {session?.user?.email}
            </p>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                onShowSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 rounded-xl transition-colors text-left"
            >
              <User className="w-4 h-4 text-stone-400" />
              {t("tabs.profile") || "Profile"}
            </button>

            <button
              onClick={() => {
                onShowUsage();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 rounded-xl transition-colors text-left"
            >
              <Database className="w-4 h-4 text-stone-400" />
              {t("tabs.usage") || "Usage Stats"}
            </button>

            <div className="h-px bg-stone-100 my-1 mx-2"></div>

            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              {t("nav.logout")}
            </button>
          </div>

          <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              {t("nav.secure") || "Secure"}
            </div>
            <div className="text-[10px] text-stone-300 font-bold">v1.2.0</div>
          </div>
        </div>
      )}
    </div>
  );
}
