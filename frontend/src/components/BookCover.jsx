import { Trash2, Edit3, BookOpen } from "lucide-react";
import React, { useMemo } from "react";

// Generates a consistent solid color based on the title
const getDistinctColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-gradient-to-br from-[#4A2511] to-[#2E1407]", // Rich Brown
    "bg-gradient-to-br from-[#2C3E2D] to-[#162117]", // Forest Green
    "bg-gradient-to-br from-[#532929] to-[#341616]", // Deep Burgundy
    "bg-gradient-to-br from-[#1E293B] to-[#0F172A]", // Deep Navy
    "bg-gradient-to-br from-[#6B4B3A] to-[#452D21]", // Antique Leather
  ];
  return colors[Math.abs(hash) % colors.length];
};

export default function BookCover({
  story,
  session,
  easyMode,
  onClick,
  onEdit,
  onDelete,
}) {
  const isOwner = story.user_id === session?.user?.id;
  const isManual =
    story.audio_path && story.audio_path.endsWith("manual_entry");
  const coverColor = useMemo(
    () => getDistinctColor(story.title || "Memory"),
    [story.title],
  );

  const handleTilt = (e) => {
    // Optional smooth 3D tilt can be handled via CSS hover group
  };

  return (
    <div
      onClick={onClick}
      // Give hover rotation and scale locally
      className="cursor-pointer group w-full max-w-[200px] mb-2"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full aspect-[2/3] rounded-r-xl rounded-l-[4px] shadow-[4px_4px_10px_rgba(0,0,0,0.3)] group-hover:-translate-y-5 group-hover:scale-105 group-hover:rotate-y-[-12deg] group-hover:rotate-x-[5deg] group-hover:shadow-[15px_22px_30px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out flex"
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "left center",
        }}
      >
        {/* Spine Graphic Base */}
        <div className="absolute left-0 top-0 bottom-0 w-[6%] bg-black/30 rounded-l-[4px] border-r border-white/20 z-20 shadow-[2px_0_3px_rgba(0,0,0,0.5)] pointer-events-none"></div>

        {/* Hinge Line */}
        <div className="absolute left-[20px] top-0 bottom-0 w-[2px] bg-gradient-to-r from-black/40 to-transparent z-20 border-l border-white/10 pointer-events-none shadow-[1px_0_1px_rgba(0,0,0,0.3)]"></div>

        {/* Cover Container */}
        <div
          className={`absolute inset-0 w-full h-full rounded-r-xl rounded-l-[4px] overflow-hidden ${!story.cover_url ? coverColor : "bg-[#FDFBF7]"}`}
        >
          {story.cover_url ? (
            <img
              src={story.cover_url}
              alt={story.title}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0 p-4 sm:p-5 flex items-center justify-center text-center">
              <div className="border-[2px] border-[#D4AF37]/40 shadow-[inset_0_0_15px_rgba(0,0,0,0.6)] p-3 w-full h-full flex flex-col justify-between items-center bg-black/20 backdrop-blur-sm rounded-sm">
                <div className="w-10 h-1 bg-gradient-to-r from-[#D4AF37] via-[#F9E27E] to-[#D4AF37] rounded-full mt-1 opacity-90 shadow-[0_1px_2px_rgba(0,0,0,0.8)]"></div>
                <h2
                  className={`font-serif font-bold text-wrap pb-2 pt-2 bg-gradient-to-br from-[#F9E27E] via-[#D4AF37] to-[#AA771C] text-transparent bg-clip-text drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-wide ${easyMode ? "text-[1.35rem] leading-tight" : "text-lg leading-snug"}`}
                >
                  {story.title || "Untitled Memory"}
                </h2>
                <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#D4AF37] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-95 mb-1">
                  {story.created_at
                    ? new Date(story.created_at).getFullYear()
                    : "Memoir"}
                </div>
              </div>
            </div>
          )}

          {/* Book sheen/reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/30 pointer-events-none border border-white/10 rounded-r-xl rounded-l-[4px]"></div>
        </div>
      </div>
    </div>
  );
}
