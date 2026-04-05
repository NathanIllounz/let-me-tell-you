import { Trash2, Edit3 } from 'lucide-react';

export default function StoryCard({ story, session, onClick, onEdit, onDelete }) {
  const isManual = story.audio_path && story.audio_path.endsWith('manual_entry');
  const isOwner = story.user_id === session?.user?.id;

  return (
    <div 
      onClick={onClick}
      className="p-6 bg-white rounded-xl shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all cursor-pointer group flex flex-col h-full relative"
    >
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isManual && isOwner && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit?.(story); }}
            className="p-1.5 bg-white/90 hover:bg-white text-stone-400 hover:text-indigo-600 rounded-full shadow-sm border border-stone-100 transition-all"
            title="Edit Memory"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
        {isOwner && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(story); }}
            className="p-1.5 bg-white/90 hover:bg-white text-stone-400 hover:text-red-500 rounded-full shadow-sm border border-stone-100 transition-all"
            title="Delete Memory"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <h2 className="text-xl font-bold text-stone-800 mb-3 group-hover:text-stone-900 font-serif border-b border-stone-100 pb-3 pr-14">
        {story.title || "Untitled Memory"}
      </h2>
      
      <div className="flex-1">
        {story.refined_story && (
          <p className="text-stone-600 leading-relaxed line-clamp-4">
            {story.refined_story}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-between items-center text-xs text-stone-400 font-medium">
        <span>{story.created_at ? new Date(story.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric'}) : 'Just now'}</span>
        {story.audio_path && !isManual && (
          <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
            Includes Audio
          </span>
        )}
      </div>
    </div>
  );
}
