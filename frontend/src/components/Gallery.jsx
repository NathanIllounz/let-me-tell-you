import { useEffect, useState, useMemo } from 'react';
import { BookOpen, RefreshCw, Mic, PenTool, Trash2, Edit3, KeyRound } from 'lucide-react';
import api from '../api';
import BookCover from './BookCover';
import ManualEntry from './ManualEntry';
import VoiceRecorder from './VoiceRecorder';

export default function Gallery({ session, onSelectStory, groups, onGroupRefresh, activeView, setActiveView, easyMode }) {
  const [allStories, setAllStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [storyToEdit, setStoryToEdit] = useState(null);

  const fetchStories = async () => {
    setLoading(true);
    let url = `/stories?user_id=${session?.user?.id}`;

    try {
      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setAllStories(Array.isArray(response.data) ? response.data : (response.data.stories || []));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, session?.access_token]); // Removed activeView dependency!

  const activeGroup = groups?.find(g => g.id === activeView);
  const isGroupCreator = activeGroup && activeGroup.creator_id === session?.user?.id;

  const visibleStories = useMemo(() => {
    if (activeView === 'my_memories') {
      return allStories.filter(s => s.user_id === session?.user?.id);
    } else if (activeView && activeView !== 'all') {
      return allStories.filter(s => s.story_groups?.some(g => g.group_id === activeView));
    }
    return allStories;
  }, [allStories, activeView, session?.user?.id]);

  const { groupedStories, monthKeys } = useMemo(() => {
    const grouped = visibleStories.reduce((acc, story) => {
      const dt = new Date(story.created_at || Date.now());
      const key = dt.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[key]) acc[key] = [];
      acc[key].push(story);
      return acc;
    }, {});
    
    // Sort keys descending
    const keys = Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a));
    return { groupedStories: grouped, monthKeys: keys };
  }, [visibleStories]);

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
    <main className="min-h-[calc(100vh-80px)] bg-[#FDFBF7] text-[#4A3D33] overflow-hidden">
      <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-[#4A3D33] font-serif">
             {activeView === 'my_memories' ? 'My Memories' : activeGroup ? activeGroup.name : 'Your Library'}
          </h2>
          {activeGroup && (
             <p className="text-stone-500 text-sm mt-1">Circle Invite Code: <span className="font-mono font-bold text-stone-700">{activeGroup.invite_code}</span></p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isGroupCreator && (
             <>
               <button onClick={handleEditGroupName} className="p-2 bg-white border border-[#E5DACD] hover:bg-[#F3EBE1] hover:text-[#4A3D33] text-[#8C7A6B] rounded-lg shadow-sm transition-colors" title="Edit Name"><Edit3 className="w-4 h-4"/></button>
               <button onClick={handleRefreshCode} className="p-2 bg-white border border-[#E5DACD] hover:bg-[#F3EBE1] hover:text-indigo-600 text-[#8C7A6B] rounded-lg shadow-sm transition-colors" title="Refresh Invite Code"><KeyRound className="w-4 h-4"/></button>
               <button onClick={handleDeleteGroup} className="p-2 bg-white border border-[#E5DACD] hover:bg-red-50 hover:text-red-600 text-[#8C7A6B] rounded-lg shadow-sm transition-colors" title="Delete Circle"><Trash2 className="w-4 h-4"/></button>
             </>
          )}
          <button
            onClick={fetchStories}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5DACD] hover:bg-[#F3EBE1] text-[#4A3D33] font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <RefreshCw className="w-8 h-8 animate-spin text-[#8C7A6B]" />
          <span className="ml-3 text-[#8C7A6B] text-lg font-medium tracking-wide font-serif">Organizing library...</span>
        </div>
      ) : visibleStories.length > 0 ? (
        <div className="flex flex-col gap-16 mt-6">
          {monthKeys.map((monthKey, idx) => (
              <div key={monthKey} className="relative pt-4">
                <h3 className="text-xl font-serif font-bold text-[#8C7A6B] border-b border-[#E5DACD] pb-2 mb-8 pl-4 uppercase tracking-widest">{monthKey}</h3>
                
                {/* The Wooden Shelf 3D Ledge */}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-[#5C4D42] via-[#4A3D33] to-[#2E251E] shadow-[0_15px_30px_rgba(0,0,0,0.2)] z-0 border-t-2 border-[#8C7A6B]/80 box-border rounded-t-sm"></div>
                {/* Shelf bottom shadow */}
                <div className="absolute inset-x-[-15px] bottom-[-8px] h-3 bg-[#1A1510] z-0 opacity-20 shadow-[0_5px_15px_rgba(0,0,0,0.4)] rounded-b-md blur-sm"></div>

                {/* Books Container */}
                <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4 relative z-10 pb-6 items-end ${easyMode ? 'md:grid-cols-3 lg:grid-cols-4 gap-8' : ''}`}>
                   
                   {/* Capture Modules on the first shelf */}
                   {idx === 0 && (
                     <>
                       <div className={`w-full max-w-[200px] mb-2 aspect-[2/3] ${easyMode ? 'p-8' : 'p-6'} bg-[#FDFBF7] rounded-r-xl rounded-l-[4px] border-2 border-dashed border-[#8C7A6B]/80 flex flex-col justify-center items-center text-center gap-4 hover:border-[#5C4D42] hover:bg-[#F3EBE1] transition-all cursor-pointer shadow-sm hover:shadow-md group book-entry`}
                            onClick={() => setShowVoiceRecorder(true)}>
                         <Mic className={`${easyMode ? 'w-12 h-12' : 'w-8 h-8'} text-[#8C7A6B] group-hover:text-[#5C4D42] transition-colors drop-shadow-sm`} />
                         <h3 className={`${easyMode ? 'text-2xl' : 'text-lg'} font-bold text-[#5C4D42] font-serif leading-tight`}>
                           {easyMode ? 'Record Audio' : <>Capture<br/>Voice</>}
                         </h3>
                       </div>
                       
                       <div className={`w-full max-w-[200px] mb-2 aspect-[2/3] ${easyMode ? 'p-8' : 'p-6'} bg-gradient-to-br from-[#E5DACD] to-[#D6CBBA] rounded-r-xl rounded-l-[4px] border border-[#8C7A6B]/50 flex flex-col justify-center items-center text-center gap-4 hover:border-[#5C4D42] hover:brightness-[1.02] transition-all cursor-pointer shadow-md hover:shadow-lg group book-entry`}
                            onClick={() => setShowWriteModal(true)}>
                         <PenTool className={`${easyMode ? 'w-12 h-12' : 'w-8 h-8'} text-[#5C4D42] transition-colors drop-shadow-sm`} />
                         <h3 className={`${easyMode ? 'text-2xl' : 'text-lg'} font-bold text-[#4A3D33] font-serif leading-tight drop-shadow-sm`}>
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
          ))}
        </div>
      ) : (
        <div className="mt-10 p-12 bg-white rounded-2xl border border-[#E5DACD] shadow-xl flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="bg-[#F3EBE1] p-6 rounded-full mb-6 border border-[#E5DACD]">
            <BookOpen className="w-12 h-12 text-[#8C7A6B]" />
          </div>
          <h2 className="text-4xl font-bold text-[#4A3D33] mb-4 font-serif">Your library starts here.</h2>
          <p className="text-xl text-[#8C7A6B] mb-12 max-w-lg leading-relaxed">Capture your first memory. You can record it just by speaking, or write it in your journal.</p>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full justify-center max-w-xl">
            <button 
              onClick={() => setShowVoiceRecorder(true)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-[#FDFBF7] hover:bg-[#F3EBE1] border-2 border-[#E5DACD] hover:border-[#8C7A6B] rounded-xl transition-all group shadow-md hover:shadow-lg"
            >
              <div className="bg-white p-4 rounded-full text-[#5C4D42] shadow-sm group-hover:scale-110 transition-transform border border-[#E5DACD]">
                <Mic className="w-8 h-8" />
              </div>
              <span className="font-bold text-[#4A3D33] text-xl font-serif">Record a Story</span>
            </button>

            <button 
              onClick={() => setShowWriteModal(true)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-br from-[#E5DACD] to-[#D6CBBA] hover:from-[#D6CBBA] hover:to-[#C6BBAC] border border-[#8C7A6B]/50 hover:border-[#5C4D42] rounded-xl transition-all group shadow-md hover:shadow-lg"
            >
              <div className="bg-white/80 p-4 rounded-full text-[#4A3D33] shadow-sm group-hover:scale-110 transition-transform border border-white/50">
                <PenTool className="w-8 h-8" />
              </div>
              <span className="font-bold text-[#4A3D33] text-xl font-serif">Write a Memory</span>
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
