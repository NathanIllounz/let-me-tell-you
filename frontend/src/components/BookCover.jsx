import { Trash2, Edit3, BookOpen } from 'lucide-react';
import React, { useMemo } from 'react';

// Generates a consistent solid color based on the title
const getDistinctColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-red-800', 'bg-blue-900', 'bg-emerald-800', 'bg-amber-800', 'bg-purple-900', 'bg-rose-900', 'bg-indigo-900'
  ];
  return colors[Math.abs(hash) % colors.length];
};

export default function BookCover({ story, session, easyMode, onClick, onEdit, onDelete }) {
  const isOwner = story.user_id === session?.user?.id;
  const isManual = story.audio_path && story.audio_path.endsWith('manual_entry');
  const coverColor = useMemo(() => getDistinctColor(story.title || "Memory"), [story.title]);

  const handleTilt = (e) => {
    // Optional smooth 3D tilt can be handled via CSS hover group
  };

  return (
    <div className="flex flex-col items-center h-full">
      <div 
        onClick={onClick}
        // Give hover rotation and scale locally
        className="cursor-pointer group w-full max-w-[200px] mb-2"
        style={{ perspective: '1000px' }}
      >
        <div 
          className="relative w-full aspect-[2/3] rounded-r-xl rounded-l-[4px] shadow-[4px_4px_10px_rgba(0,0,0,0.3)] group-hover:-translate-y-5 group-hover:scale-105 group-hover:rotate-y-[-12deg] group-hover:rotate-x-[5deg] group-hover:shadow-[15px_22px_30px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out flex"
          style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center' }}
        >
          {/* Spine Graphic Base */}
          <div className="absolute left-0 top-0 bottom-0 w-[6%] bg-black/30 rounded-l-[4px] border-r border-white/20 z-20 shadow-[2px_0_3px_rgba(0,0,0,0.5)] pointer-events-none"></div>
          
          {/* Hinge Line */}
          <div className="absolute left-[20px] top-0 bottom-0 w-[2px] bg-gradient-to-r from-black/40 to-transparent z-20 border-l border-white/10 pointer-events-none shadow-[1px_0_1px_rgba(0,0,0,0.3)]"></div>
          
          {/* Cover Container */}
          <div className={`absolute inset-0 w-full h-full rounded-r-xl rounded-l-[4px] overflow-hidden ${!story.cover_url ? coverColor : 'bg-stone-300'}`}>
            {story.cover_url ? (
              <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="absolute inset-0 p-4 sm:p-5 flex items-center justify-center text-center">
                <div className="border-[2px] border-[#D4AF37]/50 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)] p-3 w-full h-full flex flex-col justify-between items-center bg-black/10 backdrop-blur-[2px]">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#F9E27E] rounded-full mt-1 opacity-80"></div>
                  <h2 className={`font-serif font-bold text-wrap pb-4 bg-gradient-to-b from-[#F9E27E] via-[#D4AF37] to-[#AA7C11] text-transparent bg-clip-text drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wide ${easyMode ? 'text-[1.35rem] leading-tight' : 'text-lg leading-snug'}`}>
                    {story.title || "Untitled Memory"}
                  </h2>
                  <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-[#F9E27E] to-[#D4AF37] text-transparent bg-clip-text drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] opacity-90 mb-2">
                    {story.created_at ? new Date(story.created_at).getFullYear() : 'Memoir'}
                  </div>
                </div>
              </div>
            )}
            
            {/* Book sheen/reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/30 pointer-events-none border border-white/10 rounded-r-xl rounded-l-[4px]"></div>
          </div>
        </div>
      </div>

      {/* Controls underneath the book */}
      <div className={`w-full mt-auto flex ${easyMode ? 'flex-col gap-2 mt-4 px-2' : 'justify-center items-end pb-2 opacity-10 gap-2 hover:opacity-100'} transition-all`}>
        {easyMode ? (
           <>
             <button 
                onClick={onClick}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-lg flex justify-center items-center gap-2 shadow opacity-100"
             >
                <BookOpen className="w-4 h-4"/> Read
             </button>
             {isOwner && isManual && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onEdit?.(story); }}
                 className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-lg flex justify-center items-center gap-2"
               >
                 <Edit3 className="w-4 h-4"/> Edit
               </button>
             )}
             {isOwner && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onDelete?.(story); }}
                 className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg flex justify-center items-center gap-2"
               >
                 <Trash2 className="w-4 h-4"/> Delete
               </button>
             )}
           </>
        ) : (
           <>
             {isOwner && isManual && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onEdit?.(story); }}
                 className="p-1.5 text-stone-400 hover:text-indigo-600 bg-white border border-stone-200 rounded-full hover:shadow-md transition-all bg-white/50 backdrop-blur-sm"
                 title="Edit Memory"
               >
                 <Edit3 className="w-4 h-4" />
               </button>
             )}
             {isOwner && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onDelete?.(story); }}
                 className="p-1.5 text-stone-400 hover:text-red-500 bg-white border border-stone-200 rounded-full hover:shadow-md transition-all bg-white/50 backdrop-blur-sm"
                 title="Delete Memory"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
             )}
           </>
        )}
      </div>
    </div>
  );
}
