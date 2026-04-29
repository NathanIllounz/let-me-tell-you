import { useState } from "react";
import {
  X,
  Save,
  RefreshCw,
  Globe,
  KeyRound,
  User,
  Phone,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";

export default function SettingsModal({ session, onClose }) {
  const { t, i18n } = useTranslation();
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState(
    session?.user?.user_metadata?.language || "en",
  );
  const [gender, setGender] = useState(
    session?.user?.user_metadata?.gender || "female",
  );
  const [fullName, setFullName] = useState(
    session?.user?.user_metadata?.full_name || "",
  );
  const [phone, setPhone] = useState(session?.user?.user_metadata?.phone || "");
  const [city, setCity] = useState(session?.user?.user_metadata?.city || "");
  const [dob, setDob] = useState(session?.user?.user_metadata?.dob || "");
  const [familyStatus, setFamilyStatus] = useState(
    session?.user?.user_metadata?.family_status || "parent",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const updates = {};

      if (password) {
        updates.password = password;
      }

      const meta = {
        language,
        gender,
        full_name: fullName,
        phone,
        city,
        dob,
        family_status: familyStatus,
      };
      updates.data = meta;

      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      // Update local language immediately
      i18n.changeLanguage(language);

      setMessage(t("profile.save_success") || "Settings updated successfully!");
      if (password) {
        setPassword("");
      }

      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || "Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center pt-16 pb-4">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
            <h2 className="text-xl font-bold text-stone-800 font-serif">
              {t("profile.title")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSave}
            className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]"
          >
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-sm">
                {message}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <KeyRound className="w-4 h-4" /> {t("landing.password_label")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <User className="w-4 h-4" /> {t("profile.full_name")}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
                placeholder="Jane Doe"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                  <Phone className="w-4 h-4" /> {t("profile.phone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
                  placeholder="+1..."
                  disabled={loading}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                  <MapPin className="w-4 h-4" /> {t("profile.city")}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
                  placeholder="Paris"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                  <Calendar className="w-4 h-4" /> {t("profile.dob")}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                  <Users className="w-4 h-4" /> {t("profile.family_status")}
                </label>
                <select
                  value={familyStatus}
                  onChange={(e) => setFamilyStatus(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow bg-white"
                  disabled={loading}
                >
                  <option value="grandparent">
                    {t("family_status.grandparent")}
                  </option>
                  <option value="parent">{t("family_status.parent")}</option>
                  <option value="child">{t("family_status.child")}</option>
                  <option value="aunt_uncle">
                    {t("family_status.aunt_uncle")}
                  </option>
                  <option value="other">{t("family_status.other")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <Globe className="w-4 h-4" /> {t("profile.language")}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow bg-white"
                disabled={loading}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <User className="w-4 h-4" /> {t("profile.gender")}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow bg-white"
                disabled={loading}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-stone-600 hover:bg-stone-200 bg-stone-100 rounded-lg font-medium transition-colors text-sm"
              >
                {t("profile.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-sm"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? "..." : t("profile.save_changes")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
