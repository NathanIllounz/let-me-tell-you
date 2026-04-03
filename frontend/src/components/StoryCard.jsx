export default function StoryCard({ story, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="p-6 bg-white rounded-xl shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all cursor-pointer group flex flex-col h-full"
    >
      <h2 className="text-xl font-bold text-stone-800 mb-3 group-hover:text-stone-900 font-serif border-b border-stone-100 pb-3">
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
        {story.audio_path && !story.audio_path.endsWith('manual_entry') && (
          <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
            Includes Audio
          </span>
        )}
      </div>
    </div>
  );
}
