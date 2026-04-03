import { ArrowLeft, PlayCircle } from 'lucide-react';

export default function StoryDetail({ story, onBack }) {
  const hasAudio = story.audio_path && !story.audio_path.endsWith('manual_entry');

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-stone-200 pb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </button>
          <h2 className="text-4xl font-bold text-stone-800 font-serif leading-tight">{story.title || "Untitled Memory"}</h2>
          {story.created_at && (
            <p className="text-stone-500 mt-2 text-lg">{new Date(story.created_at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          )}
        </div>

        {/* Right Side: Play Action */}
        {hasAudio && (
          <button 
            onClick={() => {
              if (story.audio_path) {
                window.open(story.audio_path, '_blank');
              }
            }}
            className="flex items-center gap-4 px-6 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 group"
          >
            <PlayCircle className="w-10 h-10 opacity-90 group-hover:opacity-100" />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-bold text-lg">Play Original Voice</span>
              <span className="text-emerald-200 text-sm">Listen to the recording</span>
            </div>
          </button>
        )}
      </div>

      {/* Main Layout: Split View / Content */}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Reader View */}
        <div className="flex-1 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 md:p-12">
            <h3 className="text-stone-400 uppercase tracking-widest text-sm font-bold mb-8 flex items-center gap-4">
              Reader View
              <div className="h-px bg-stone-100 flex-1"></div>
            </h3>
            
            <div className="prose prose-stone prose-lg max-w-none text-stone-700 font-serif leading-loose">
              <p className="whitespace-pre-wrap">{story.refined_story || "No text content available for this memory."}</p>
            </div>
          </div>
        </div>

        {/* Right Column (optional styling for any side metadata if needed) */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="bg-stone-100 rounded-2xl p-8 border border-stone-200 sticky top-24 shadow-inner">
            <h4 className="font-bold text-stone-800 text-xl border-b border-stone-200 pb-3 mb-4 font-serif">Memory Details</h4>
            <p className="text-stone-500 text-base mb-6 leading-relaxed">Captured preserving the exact tone and nuance of the original storyteller.</p>
            
            {hasAudio ? (
               <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                     <PlayCircle className="w-5 h-5"/>
                   </div>
                   <span className="font-medium text-stone-700">Source Audio</span>
                 </div>
                 <span className="text-xs font-bold text-stone-400 uppercase">Available</span>
               </div>
            ) : (
               <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm text-center">
                  <span className="text-stone-500 text-sm italic block">This memory was written manually. No source audio recorded.</span>
               </div>
            )}
            
            <button 
              onClick={onBack}
              className="mt-8 w-full py-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium rounded-lg transition-colors shadow-sm"
            >
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom bar for mobile */}
      <div className="mt-8 block lg:hidden">
         <button 
          onClick={onBack}
          className="w-full py-4 bg-stone-100 text-stone-700 font-medium rounded-xl border border-stone-200 transition-colors"
        >
          Back to Gallery
        </button>
      </div>

    </div>
  );
}
