import { useEffect, useState } from 'react';
import { BookOpen, RefreshCw, Mic, PenTool } from 'lucide-react';
import api from '../api';
import StoryCard from './StoryCard';
import ManualEntry from './ManualEntry';

export default function Gallery({ session, onSelectStory }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/stories?user_id=${session?.user?.id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setStories(Array.isArray(response.data) ? response.data : (response.data.stories || []));
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchStories();
    }
  }, [session]);

  return (
    <main className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-bold text-stone-800 font-serif">Your Memories</h2>
        <button
          onClick={fetchStories}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <RefreshCw className="w-8 h-8 animate-spin text-stone-400" />
          <span className="ml-3 text-stone-500 text-lg font-medium tracking-wide">Loading memories...</span>
        </div>
      ) : stories.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* The Action Card always visible even if stories > 0, to let users create more */}
            <div className="p-8 bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 flex flex-col justify-center items-center text-center gap-4 hover:border-stone-400 transition-colors">
              <BookOpen className="w-10 h-10 text-stone-400 mb-2" />
              <h3 className="text-xl font-bold text-stone-700 font-serif">Capture another</h3>
              <div className="flex flex-col gap-3 w-full mt-4">
                <button className="flex items-center justify-center gap-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 px-4 py-3 rounded-lg shadow-sm font-medium transition-colors w-full group">
                  <Mic className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" /> Record Audio
                </button>
                <button 
                  onClick={() => setShowWriteModal(true)}
                  className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-white px-4 py-3 rounded-lg shadow-sm font-medium transition-colors w-full group"
                >
                  <PenTool className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" /> Write Text
                </button>
              </div>
            </div>

            {stories.map((story) => (
              <StoryCard 
                key={story.id || story._id || Math.random()} 
                story={story} 
                onClick={() => onSelectStory(story)} 
              />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-10 p-12 bg-white rounded-2xl border border-stone-100 shadow-xl flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="bg-stone-50 p-6 rounded-full mb-6 border border-stone-100">
            <BookOpen className="w-12 h-12 text-indigo-900" />
          </div>
          <h2 className="text-4xl font-bold text-stone-800 mb-4 font-serif">Your legacy starts here.</h2>
          <p className="text-xl text-stone-500 mb-12 max-w-lg leading-relaxed">Capture your first memory. You can record it just by speaking, or write it down yourself.</p>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full justify-center max-w-xl">
            <button className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-white hover:bg-emerald-50 border-2 border-stone-200 hover:border-emerald-200 rounded-xl transition-all group shadow-sm hover:shadow-md">
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-700 group-hover:scale-110 transition-transform">
                <Mic className="w-8 h-8" />
              </div>
              <span className="font-bold text-stone-800 text-xl">Record a Story</span>
            </button>

            <button 
              onClick={() => setShowWriteModal(true)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-white hover:bg-indigo-50 border-2 border-stone-200 hover:border-indigo-200 rounded-xl transition-all group shadow-sm hover:shadow-md"
            >
              <div className="bg-indigo-100 p-4 rounded-full text-indigo-700 group-hover:scale-110 transition-transform">
                <PenTool className="w-8 h-8" />
              </div>
              <span className="font-bold text-stone-800 text-xl">Write a Memory</span>
            </button>
          </div>
        </div>
      )}

      {showWriteModal && (
        <ManualEntry 
          session={session} 
          onClose={() => setShowWriteModal(false)} 
          onSaveSuccess={fetchStories} 
        />
      )}
    </main>
  );
}
