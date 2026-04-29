import { useState, useEffect } from "react";
import { X, RefreshCw, Database, Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from '../api';

export default function UsageModal({ session, onClose }) {
  const { t } = useTranslation();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!session?.user?.id) return;
      try {
        const response = await api.get(`/usage/${session.user.id}`);
        setUsageData(response.data);
      } catch (err) {
        console.error("Usage fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [session?.user?.id]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center pt-16 pb-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-stone-50/50">
            <div>
              <h2 className="text-2xl font-bold text-stone-800 tracking-tight">
                {t("tabs.usage") || "Usage Statistics"}
              </h2>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] mt-1">
                Let Me Tell You • Library Stats
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-8 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="w-8 h-8 text-stone-300 animate-spin" />
                <p className="text-stone-400 text-sm">
                  Gathering your library stats...
                </p>
              </div>
            ) : usageData ? (
              <>
                {/* Storage Section */}
                <div>
                  <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Storage Usage
                  </h3>
                  {(() => {
                    const { audio_bytes, narrator_bytes, cover_bytes } = usageData.storage;
                    const ONE_GB = 1024 * 1024 * 1024;
                    const getWidth = (val) => {
                      if (val === 0) return "0%";
                      const percentage = (val / ONE_GB) * 100;
                      return `${Math.min(100, Math.max(2, percentage))}%`;
                    };
                    
                    return (
                      <div className="grid gap-4">
                        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-stone-700">
                              Original Audio
                            </span>
                            <span className="text-sm font-bold text-stone-900">
                              {formatBytes(audio_bytes)}
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-stone-400 h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: getWidth(audio_bytes) }}
                            ></div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-stone-700">
                              Narrator (TTS)
                            </span>
                            <span className="text-sm font-bold text-stone-900">
                              {formatBytes(narrator_bytes)}
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: getWidth(narrator_bytes) }}
                            ></div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-stone-700">
                              Story Covers
                            </span>
                            <span className="text-sm font-bold text-stone-900">
                              {formatBytes(cover_bytes)}
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: getWidth(cover_bytes) }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* AI Activity Section */}
                <div>
                  <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> AI Activity
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(usageData.ai_stats).map(
                      ([service, stats]) => (
                        <div
                          key={service}
                          className="bg-stone-800 text-stone-100 p-5 rounded-2xl flex items-center justify-between shadow-lg"
                        >
                          <div>
                            <h4 className="text-xs uppercase tracking-tighter text-stone-400 font-bold mb-1">
                              {service === "ghostwriter"
                                ? "Gemini Writer"
                                : service === "artist"
                                  ? "AI Artist"
                                  : "AI Narrator"}
                            </h4>
                            <p className="text-2xl font-bold">
                              {stats.all_time}{" "}
                              <span className="text-xs font-normal text-stone-500">
                                generations
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-4 border-l border-stone-700 pl-6">
                            <div className="text-center">
                              <p className="text-[10px] uppercase text-stone-500 font-bold">
                                Today
                              </p>
                              <p className="text-lg font-bold">
                                {stats.today}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] uppercase text-stone-500 font-bold">
                                Week
                              </p>
                              <p className="text-lg font-bold">
                                {stats.this_week}
                              </p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-stone-400">No usage data found.</p>
              </div>
            )}
            <div className="flex justify-center pb-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-bold transition-all text-sm shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
