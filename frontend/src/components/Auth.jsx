import { useState } from "react";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";

export default function Auth({ supabase }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login");
  const [identifier, setIdentifier] = useState(""); // Can be email or username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [dob, setDob] = useState("");
  const [familyStatus, setFamilyStatus] = useState("parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      let targetEmail = email;

      if (mode === "login") {
        // Resolve identifier (email or username) to a full email
        try {
          const res = await api.post("/auth/resolve", { identifier });
          targetEmail = res.data.email;
        } catch (resolveErr) {
          throw new Error(
            resolveErr.response?.data?.detail ||
              "Could not find your account. Please use your full email.",
          );
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              city: city,
              dob: dob,
              family_status: familyStatus,
            },
          },
        });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      }
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8 sm:p-10 bg-[#FDFBF7] rounded-xl">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-stone-800 font-serif tracking-tight">
          {mode === "login"
            ? t("landing.login_welcome")
            : t("landing.signup_welcome")}
        </h2>
        <p className="text-stone-500 mt-3 text-lg font-medium">
          {mode === "login"
            ? t("landing.login_subtitle")
            : t("landing.signup_subtitle")}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex items-center justify-center w-full py-3 px-4 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-all font-medium text-stone-700 text-lg gap-3 mb-8 disabled:opacity-50 shadow-sm"
      >
        <svg fill="currentColor" width="24" height="24" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {t("landing.google_signin")}
      </button>

      <div className="relative flex items-center py-2 mb-8">
        <div className="flex-grow border-t border-stone-200"></div>
        <span className="flex-shrink-0 mx-4 text-stone-400 text-sm font-medium uppercase tracking-wider">
          {t("landing.email_signin")}
        </span>
        <div className="flex-grow border-t border-stone-200"></div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-base rounded-lg border border-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="p-4 bg-[#EDF7ED] text-[#2E7D32] text-base rounded-lg border border-[#A5D6A7]">
            {message}
          </div>
        )}

        {mode === "login" ? (
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              {t("landing.email_label")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-stone-400" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-12 w-full p-3 text-lg bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-[#8C7A6B] focus:border-[#8C7A6B] outline-none transition-shadow"
                placeholder="nathan or nathan@example.com"
                required
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              {t("profile.email") || "Email Address"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-stone-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 w-full p-3 text-lg bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-[#8C7A6B] focus:border-[#8C7A6B] outline-none transition-shadow"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
        )}

        {mode === "signup" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                {t("profile.full_name")}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 text-lg bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-[#8C7A6B] focus:border-[#8C7A6B] outline-none transition-shadow"
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  {t("profile.phone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 text-lg bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-[#8C7A6B] focus:border-[#8C7A6B] outline-none transition-shadow"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  {t("profile.city")}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 text-lg bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-[#8C7A6B] focus:border-[#8C7A6B] outline-none transition-shadow"
                  placeholder="Paris"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  {t("profile.dob")}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-3 text-lg bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-[#8C7A6B] focus:border-[#8C7A6B] outline-none transition-shadow"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  {t("profile.family_status")}
                </label>
                <select
                  value={familyStatus}
                  onChange={(e) => setFamilyStatus(e.target.value)}
                  className="w-full p-3 text-lg bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-[#8C7A6B] focus:border-[#8C7A6B] outline-none transition-shadow h-[52px]"
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
          </>
        )}

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {t("landing.password_label")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 w-full p-3 text-lg bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-[#8C7A6B] focus:border-[#8C7A6B] outline-none transition-shadow"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#5C4D42] hover:bg-[#4A3D33] text-[#FDFBF7] font-medium py-3.5 px-6 rounded-lg transition-colors disabled:opacity-50 text-lg mt-4 shadow-md border border-[#4A3D33]"
        >
          {mode === "login" ? (
            <>
              <LogIn className="w-5 h-5" /> {t("landing.login_button")}
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" /> {t("landing.signup_button")}
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-[#8C7A6B] hover:text-[#5C4D42] transition-colors text-base font-semibold underline underline-offset-4"
        >
          {mode === "login"
            ? t("landing.switch_signup")
            : t("landing.switch_login")}
        </button>
      </div>
    </div>
  );
}
