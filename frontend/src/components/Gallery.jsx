import { useEffect, useState } from 'react';
import { BookOpen, RefreshCw, Mic, PenTool, Trash2, Edit3, KeyRound } from 'lucide-react';
import api from '../api';
import BookCover from './BookCover';
import ManualEntry from './ManualEntry';
import VoiceRecorder from './VoiceRecorder';

export default function Gallery({ session, onSelectStory, groups, onGroupRefresh, activeView, setActiveView, easyMode }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [storyToEdit, setStoryToEdit] = useState(null);

  const fetchStories = async () => {
    setLoading(true);
    let url = `/stories?user_id=${session?.user?.id}`;
    if (activeView === 'my_memories') {
      url += '&filter_me=true';
    } else if (activeView && activeView !== 'all') {
      url += `&group_id=${activeView}`;
    }

    try {
      const response = await api.get(url, {
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
  }, [session?.user?.id, session?.access_token, activeView]);

  const activeGroup = groups?.find(g => g.id === activeView);
  const isGroupCreator = activeGroup && activeGroup.creator_id === session?.user?.id;

  const handleDeleteGroup = async () => {
     if(!window.confirm(`Are you sure you want to delete the circle "${activeGroup.name}"? This removes it for all members.`)) return;
     try {
        await api.delete(`/groups/${activeGroup.id}?user_id=${session.user.id}`);
        setActiveView('all');
        onGroupRefresh?.();
     } catch (e) {
        alert("Failed to delete group.");
     }
  };
  const handleEditGroupName = async () => {
     const newName = window.prompt("Enter new circle name:", activeGroup.name);
     if (!newName || newName === activeGroup.name) return;
     try {
        await api.put(`/groups/${activeGroup.id}`, { name: newName, user_id: session.user.id });
        onGroupRefresh?.();
     } catch(e) {
        alert("Failed to update group name.");
     }
  };
  const handleRefreshCode = async () => {
     try {
        const res = await api.post(`/groups/${activeGroup.id}/refresh_invite`, { user_id: session.user.id });
        alert(`New Invite Code generated: ${res.data.invite_code}`);
        onGroupRefresh?.();
     } catch (e) {
        alert("Failed to refresh invite code.");
     }
  };

  const handleDeleteStory = async (story) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${story.title || 'Untitled Memory'}"?`);
    if (!isConfirmed) return;

    try {
      await api.delete(`/stories/${story.id}?user_id=${session?.user?.id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      fetchStories();
    } catch (error) {
      console.error('Failed to delete story:', error);
      alert('Failed to delete story. Please try again.');
    }
  };

  const handleEditStory = (story) => {
    setStoryToEdit(story);
    setShowWriteModal(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-900 via-[#1e1208] to-[#120a05] text-stone-100">
      <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-stone-100 font-serif">
             {activeView === 'my_memories' ? 'My Memories' : activeGroup ? activeGroup.name : 'Your Memories'}
          </h2>
          {activeGroup && (
             <p className="text-stone-400 text-sm mt-1">Circle Invite Code: <span className="font-mono font-bold text-stone-300">{activeGroup.invite_code}</span></p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isGroupCreator && (
             <>
               <button onClick={handleEditGroupName} className="p-2 bg-white border border-stone-200 hover:bg-stone-50 hover:text-stone-700 text-stone-500 rounded-lg shadow-sm transition-colors" title="Edit Name"><Edit3 className="w-4 h-4"/></button>
               <button onClick={handleRefreshCode} className="p-2 bg-white border border-stone-200 hover:bg-stone-50 hover:text-indigo-600 text-stone-500 rounded-lg shadow-sm transition-colors" title="Refresh Invite Code"><KeyRound className="w-4 h-4"/></button>
               <button onClick={handleDeleteGroup} className="p-2 bg-white border border-stone-200 hover:bg-red-50 hover:text-red-600 text-stone-500 rounded-lg shadow-sm transition-colors" title="Delete Circle"><Trash2 className="w-4 h-4"/></button>
             </>
          )}
          <button
            onClick={fetchStories}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800/80 border border-stone-600 hover:bg-stone-700 text-stone-200 font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <RefreshCw className="w-8 h-8 animate-spin text-stone-500" />
          <span className="ml-3 text-stone-400 text-lg font-medium tracking-wide">Loading memories...</span>
        </div>
      ) : stories.length > 0 ? (
        <div className="flex flex-col gap-16 mt-6">
          {Object.keys(
            stories.reduce((acc, story) => {
              const dt = new Date(story.created_at || Date.now());
              const key = dt.toLocaleString('default', { month: 'long', year: 'numeric' });
              if (!acc[key]) acc[key] = [];
              acc[key].push(story);
              return acc;
            }, {})
          ).sort((a,b) => new Date(b) - new Date(a)).map((monthKey, idx, arr) => {
             
             const groupedStories = stories.reduce((acc, story) => {
                const dt = new Date(story.created_at || Date.now());
                const key = dt.toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!acc[key]) acc[key] = [];
                acc[key].push(story);
                return acc;
             }, {});

             return (
              <div key={monthKey} className="relative pt-4">
                <h3 className="text-xl font-serif font-bold text-[#D4AF37] border-b border-stone-700/50 pb-2 mb-8 pl-4 opacity-90 uppercase tracking-widest">{monthKey}</h3>
                
                {/* The Wooden Shelf 3D Ledge */}
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-[#b58b66] via-[#8b5a2b] to-[#5c3a1c] shadow-[0_15px_25px_rgba(0,0,0,0.8)] z-0 border-t border-[#dcb388]/80 box-border rounded-t-sm"></div>
                <div className="absolute inset-x-[-15px] bottom-[-6px] h-2 bg-[#2d1b0c] z-0 opacity-90 shadow-lg border-t border-[#4a2e15]"></div>

                {/* Books Container */}
                <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4 relative z-10 pb-6 items-end ${easyMode ? 'md:grid-cols-3 lg:grid-cols-4 gap-8' : ''}`}>
                   
                   {/* Capture Modules on the first shelf */}
                   {idx === 0 && (
                     <>
                       <div className={`w-full max-w-[200px] mb-2 aspect-[2/3] ${easyMode ? 'p-8' : 'p-6'} bg-stone-900/60 backdrop-blur-md rounded-r-xl rounded-l-[4px] border-2 border-dashed border-stone-600 flex flex-col justify-center items-center text-center gap-4 hover:border-emerald-500 hover:bg-emerald-950/40 transition-all cursor-pointer shadow-lg group`}
                            onClick={() => setShowVoiceRecorder(true)}>
                         <Mic className={`${easyMode ? 'w-12 h-12' : 'w-8 h-8'} text-stone-400 group-hover:text-emerald-400 transition-colors drop-shadow-md`} />
                         <h3 className={`${easyMode ? 'text-2xl' : 'text-lg'} font-bold text-stone-300 group-hover:text-emerald-300 font-serif leading-tight`}>
                           {easyMode ? 'Record Audio' : <>Capture<br/>Voice</>}
                         </h3>
                       </div>
                       
                       <div className={`w-full max-w-[200px] mb-2 aspect-[2/3] ${easyMode ? 'p-8' : 'p-6'} bg-gradient-to-br from-[#4a1c1c] to-[#2b0f0f] backdrop-blur-md rounded-r-xl rounded-l-[4px] border border-red-900/50 flex flex-col justify-center items-center text-center gap-4 hover:border-red-400 hover:brightness-110 transition-all cursor-pointer shadow-[2px_4px_10px_rgba(0,0,0,0.6)] group`}
                            onClick={() => setShowWriteModal(true)}>
                         <PenTool className={`${easyMode ? 'w-12 h-12' : 'w-8 h-8'} text-[#D4AF37]/80 group-hover:text-[#F9E27E] transition-colors drop-shadow-md`} />
                         <h3 className={`${easyMode ? 'text-2xl' : 'text-lg'} font-bold text-[#D4AF37] group-hover:text-[#F9E27E] font-serif leading-tight drop-shadow`}>
                           {easyMode ? 'Write Story' : <>Draft<br/>Journal</>}
                         </h3>
                       </div>
                     </>
                   )}

                   {groupedStories[monthKey].map((story) => (
                      <BookCover 
                        key={story.id || Math.random()} 
                        story={story} 
                        session={session}
                        easyMode={easyMode}
                        onClick={() => onSelectStory(story)} 
                        onDelete={handleDeleteStory}
                        onEdit={handleEditStory}
                      />
                   ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 p-12 bg-stone-900/80 rounded-2xl border border-stone-700 shadow-2xl flex flex-col items-center text-center max-w-3xl mx-auto backdrop-blur-sm">
          <div className="bg-stone-800 p-6 rounded-full mb-6 border border-stone-600 shadow-inner">
            <BookOpen className="w-12 h-12 text-[#D4AF37]" />
          </div>
          <h2 className="text-4xl font-bold text-stone-100 mb-4 font-serif">Your legacy starts here.</h2>
          <p className="text-xl text-stone-400 mb-12 max-w-lg leading-relaxed">Capture your first memory. You can record it just by speaking, or write it down yourself.</p>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full justify-center max-w-xl">
            <button 
              onClick={() => setShowVoiceRecorder(true)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-stone-800 hover:bg-emerald-950 border-2 border-stone-600 hover:border-emerald-700 rounded-xl transition-all group shadow-lg hover:shadow-xl"
            >
              <div className="bg-emerald-900/50 p-4 rounded-full text-emerald-400 group-hover:scale-110 transition-transform">
                <Mic className="w-8 h-8" />
              </div>
              <span className="font-bold text-stone-200 text-xl">Record a Story</span>
            </button>

            <button 
              onClick={() => setShowWriteModal(true)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-stone-800 hover:bg-indigo-950 border-2 border-stone-600 hover:border-indigo-700 rounded-xl transition-all group shadow-lg hover:shadow-xl"
            >
              <div className="bg-indigo-900/50 p-4 rounded-full text-indigo-400 group-hover:scale-110 transition-transform">
                <PenTool className="w-8 h-8" />
              </div>
              <span className="font-bold text-stone-200 text-xl">Write a Memory</span>
            </button>
          </div>
        </div>
      )}
      </div>

      {showWriteModal && (
        <ManualEntry 
          session={session} 
          storyToEdit={storyToEdit}
          groups={groups}
          onClose={() => {
            setShowWriteModal(false);
            setStoryToEdit(null);
          }} 
          onSaveSuccess={() => {
            fetchStories();
            onGroupRefresh?.();
          }} 
        />
      )}

      {showVoiceRecorder && (
        <VoiceRecorder 
          session={session} 
          groups={groups}
          onClose={() => setShowVoiceRecorder(false)} 
          onSaveSuccess={() => {
            fetchStories();
            onGroupRefresh?.();
          }} 
        />
      )}
    </main>
  );
}
