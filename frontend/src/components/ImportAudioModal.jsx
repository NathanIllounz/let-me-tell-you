import { useState } from "react";
import {
  Upload,
  X,
  Loader2,
  FileAudio,
  AlertCircle,
  ImagePlus,
  Sparkles,
} from "lucide-react";
import api from "../api";

export default function ImportAudioModal({
  session,
  groups,
  onClose,
  onSaveSuccess,
}) {
  const [status, setStatus] = useState("idle"); // idle, processing, error, success
  const [errorMessage, setErrorMessage] = useState("");

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [groupIds, setGroupIds] = useState([]);
  const [language, setLanguage] = useState("English");
  const [shouldRefine, setShouldRefine] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const uploadAudio = async () => {
    if (!file) return;

    setStatus("processing");
    const formData = new FormData();
    formData.append("file", file);

    if (session?.user?.id) {
      formData.append("user_id", session.user.id);
    }
    if (groupIds.length > 0) {
      formData.append("group_ids", JSON.stringify(groupIds));
    }
    formData.append("language", language);
    formData.append("should_refine", shouldRefine);
    if (title) formData.append("title", title);

    try {
      if (coverFile) {
        const coverData = new FormData();
        coverData.append("file", coverFile);
        const coverRes = await api.post("/stories/upload-cover", coverData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        formData.append("cover_url", coverRes.data.cover_url);
      }

      await api.post("/stories/upload-audio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      setStatus("success");
      onSaveSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus("error");
      setErrorMessage(
        err.response?.data?.detail ||
          "Failed to process your legacy memory. Ensure the file is a valid audio format.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center pt-16 pb-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-100 w-full max-w-md overflow-hidden relative">
          {(status === "idle" || status === "error") && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="p-8 flex flex-col items-center mt-2">
            <div className="w-16 h-16 bg-[#F3EBE1] rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-[#8C7A6B]" />
            </div>
            <h2 className="text-2xl font-bold text-[#4A3D33] font-serif mb-2 text-center">
              Import Audio
            </h2>
            <p className="text-stone-500 mb-6 text-sm leading-relaxed text-center">
              Upload family recordings, vintage tapes, or any MP3/WAV file.
            </p>

            {(status === "idle" || status === "error") && (
              <div className="w-full mb-6 space-y-5 max-h-[45vh] overflow-y-auto px-2 pb-2">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Cover Photo (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Cover Preview"
                        className="w-12 h-16 object-cover rounded shadow-sm border border-stone-300"
                      />
                    )}
                    <label className="flex items-center justify-center gap-2 px-4 py-2 border border-stone-300 shadow-sm bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-lg cursor-pointer transition-colors text-sm font-bold">
                      <ImagePlus className="w-4 h-4" />
                      {previewUrl ? "Change Cover" : "Upload Cover"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        disabled={status !== "idle"}
                        className="hidden"
                      />
                    </label>
                    {previewUrl && status === "idle" && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl("");
                          setCoverFile(null);
                        }}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Audio File
                  </label>
                  <div className="flex items-center gap-2 w-full p-2.5 border border-stone-300 shadow-sm rounded-lg bg-stone-50 relative">
                    <FileAudio className="w-5 h-5 text-stone-400 shrink-0" />
                    <span className="text-sm text-stone-600 truncate flex-1">
                      {file ? file.name : "Choose an MP3 or WAV file..."}
                    </span>
                    <input
                      type="file"
                      accept="audio/mpeg, audio/wav, audio/m4a, audio/webm"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Memory Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Grandma's 1995 Interview"
                    className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Who can see this?
                  </label>
                  <div className="w-full max-h-[120px] overflow-y-auto p-3 border border-stone-300 shadow-sm rounded-lg bg-stone-50 flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={groupIds.length === 0}
                        onChange={() => setGroupIds([])}
                        className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                      />
                      Only Me (Private)
                    </label>
                    {groups?.map((g) => (
                      <label
                        key={g.id}
                        className="flex items-center gap-2 cursor-pointer text-sm text-stone-600"
                      >
                        <input
                          type="checkbox"
                          checked={groupIds.includes(g.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setGroupIds((prev) => [...prev, g.id]);
                            else
                              setGroupIds((prev) =>
                                prev.filter((id) => id !== g.id),
                              );
                          }}
                          className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                        />
                        {g.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    AI Processing
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-200 shadow-sm rounded-xl">
                    <input
                      type="checkbox"
                      id="refineImportToggle"
                      checked={shouldRefine}
                      onChange={(e) => setShouldRefine(e.target.checked)}
                      disabled={status !== "idle"}
                      className="w-5 h-5 text-indigo-600 rounded border-stone-300 focus:ring-indigo-500 transition-all cursor-pointer"
                    />
                    <label
                      htmlFor="refineImportToggle"
                      className="flex items-center gap-2 cursor-pointer select-none text-stone-700 font-medium text-sm"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Write as polished story
                    </label>
                  </div>
                  {!shouldRefine && (
                    <p className="text-xs text-stone-500 mt-2 px-1">
                      AI will transcribe directly without summarizing or
                      narrating.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Audio Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg outline-none bg-stone-50"
                    disabled={status !== "idle"}
                  >
                    <option value="English">English</option>
                    <option value="Hebrew">Hebrew</option>
                    <option value="French">French</option>
                  </select>
                </div>
              </div>
            )}

            {status === "idle" && (
              <button
                disabled={!file}
                onClick={uploadAudio}
                className="w-full py-3 bg-[#4A3D33] hover:bg-[#5C4D42] disabled:bg-stone-300 disabled:cursor-not-allowed text-[#FDFBF7] font-bold rounded-xl transition-all shadow-md"
              >
                Upload File
              </button>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center gap-4 w-full animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-1">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <span className="font-bold text-red-700">
                  Oops, something went wrong
                </span>
                <p className="text-stone-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 text-center w-full">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-3 w-full py-3 bg-[#4A3D33] text-[#FDFBF7] rounded-xl font-bold hover:bg-[#5C4D42] transition-colors shadow-sm"
                >
                  Try Again
                </button>
              </div>
            )}

            {status === "processing" && (
              <div className="flex flex-col items-center justify-center gap-6 py-10 animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border-4 border-indigo-100 shadow-inner">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="font-bold text-indigo-800 text-lg">
                    Saving Audio...
                  </span>
                  <span className="text-stone-500 text-sm mt-2 leading-relaxed">
                    {shouldRefine
                      ? "Our AI is transcribing and preparing your story. This takes about 10-20 seconds."
                      : "Securely storing your audio in the library..."}
                  </span>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center gap-4 py-8 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
                  <Upload className="w-8 h-8" />
                </div>
                <span className="font-bold text-emerald-700 text-xl font-serif">
                  Upload Complete!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
