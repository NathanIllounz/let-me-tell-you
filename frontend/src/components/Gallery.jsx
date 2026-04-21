import { useEffect, useState, useMemo } from 'react';
import { BookOpen, RefreshCw, Mic, PenTool, Trash2, Edit3, KeyRound, FileAudio } from 'lucide-react';
import api from '../api';
import BookCover from './BookCover';
import ManualEntry from './ManualEntry';
import VoiceRecorder from './VoiceRecorder';
import ImportAudioModal from './ImportAudioModal';

export default function Gallery({ session, onSelectStory, groups, onGroupRefresh, activeView, setActiveView, easyMode }) {
  const [allStories, setAllStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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
    <main className="min-h-[calc(100vh-80px)] bg-transparent text-[#4A3D33] overflow-hidden">
      <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-bold text-[#4A0E17] font-serif mb-2">
             {activeView === 'my_memories' ? 'My Memories' : activeGroup ? activeGroup.name : 'Your Library'}
          </h2>
          <p className="text-lg text-[#3E1519]/70 font-medium font-serif italic">
             {activeView === 'my_memories' ? 'Quiet reflections and private tales.' : activeGroup ? `Shared stories with ${activeGroup.name}.` : 'A growing collection of family history.'}
          </p>
          {activeGroup && (
             <p className="text-[#3E1519]/50 text-sm mt-3 font-semibold uppercase tracking-widest">Circle Invite Code: <span className="font-mono font-bold text-[#4A0E17] bg-[#c9a174]/20 px-2 py-0.5 rounded">{activeGroup.invite_code}</span></p>
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

      {easyMode && !loading && (
        <div className="mb-12 animate-fade-in-up bg-[#c9a174] text-[#1e1a17] p-8 rounded-2xl shadow-xl flex items-center justify-between mx-auto">
          <div>
             <h2 className="text-3xl font-bold font-serif mb-2">Welcome to your Library!</h2>
             <p className="text-xl font-medium opacity-90 max-w-2xl">To read a story, click on any of the big books below. To create a new one, click the microphone button to start recording.</p>
          </div>
          <div className="hidden sm:flex text-6xl">✨</div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-32 animate-fade-in-up">
           <div className="relative">
             <RefreshCw className="w-10 h-10 animate-spin text-[#c9a174] drop-shadow-sm" />
             <div className="absolute inset-0 bg-[#c9a174] blur-xl opacity-20 rounded-full animate-pulse"></div>
           </div>
          <span className="ml-4 text-[#4A0E17] text-xl font-medium tracking-wide font-serif">Organizing your library...</span>
        </div>
      ) : visibleStories.length > 0 ? (
        <div className="flex flex-col gap-16 mt-6">
          {monthKeys.map((monthKey, idx) => (
              <div key={monthKey} className={`relative pt-4 animate-fade-in-up delay-${Math.min((idx + 1) * 100, 600)}`}>
                <h3 className="text-xl font-serif font-bold text-[#4A0E17] border-b border-[#561C24]/30 pb-2 mb-8 pl-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a174]"></span>
                  {monthKey}
                </h3>
                
                {/* The Wooden Shelf 3D Ledge */}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-[#8C7A6B] via-[#7B6A5B] to-[#5C4D42] shadow-[0_15px_30px_rgba(0,0,0,0.2)] z-0 border-t-2 border-white/40 box-border rounded-t-sm"></div>
                {/* Shelf bottom shadow */}
                <div className="absolute inset-x-[-15px] bottom-[-8px] h-3 bg-[#3A2D23] z-0 opacity-20 shadow-[0_5px_15px_rgba(0,0,0,0.4)] rounded-b-md blur-sm"></div>

                {/* Books Container */}
                <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4 relative z-10 pb-6 items-end ${easyMode ? 'md:grid-cols-3 lg:grid-cols-4 gap-8' : ''}`}>
                   
                    {/* Capture Modules on the first shelf */}
                   {idx === 0 && (
                     <>
                       <div className={`w-full max-w-[200px] mb-2 aspect-[2/3] ${easyMode ? 'p-8' : 'p-6'} bg-[#3E1519] rounded-r-xl rounded-l-[4px] border-l-4 border-l-[#c9a174] flex flex-col justify-center items-center text-center gap-4 hover:-translate-y-2 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl group book-entry relative overflow-hidden`}
                            onClick={() => setShowVoiceRecorder(true)}>
                         <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                         <div className="w-12 h-12 bg-[#2B0E11] rounded-xl flex items-center justify-center shadow-inner mb-2 group-hover:bg-[#c9a174] transition-colors duration-300">
                           <Mic className={`${easyMode ? 'w-8 h-8' : 'w-6 h-6'} text-[#E5DACD] group-hover:text-[#2B0E11] transition-colors`} />
                         </div>
                         <h3 className={`${easyMode ? 'text-2xl' : 'text-lg'} font-bold text-white font-serif leading-tight z-10`}>
                           {easyMode ? 'Record Audio' : <>Capture<br/>Voice</>}
                         </h3>
                       </div>
                       
                       <div className={`w-full max-w-[200px] mb-2 aspect-[2/3] ${easyMode ? 'p-8' : 'p-6'} bg-gradient-to-br from-[#c9a174] to-[#8F7C6B] rounded-r-xl rounded-l-[4px] border-l-4 border-l-[#2B0E11] flex flex-col justify-center items-center text-center gap-4 hover:-translate-y-2 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl group book-entry relative overflow-hidden`}
                            onClick={() => setShowWriteModal(true)}>
                         <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                         <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-inner mb-2 group-hover:bg-white transition-colors duration-300 backdrop-blur-md">
                           <PenTool className={`${easyMode ? 'w-8 h-8' : 'w-6 h-6'} text-white group-hover:text-[#8F7C6B] transition-colors`} />
                         </div>
                         <h3 className={`${easyMode ? 'text-2xl' : 'text-lg'} font-bold text-white font-serif leading-tight drop-shadow-sm z-10`}>
                           {easyMode ? 'Write Story' : <>Draft<br/>Journal</>}
                         </h3>
                       </div>

                       <div className={`w-full max-w-[200px] mb-2 aspect-[2/3] ${easyMode ? 'p-8' : 'p-6'} bg-[#2B0E11] rounded-r-xl rounded-l-[4px] border-l-4 border-l-[#8F7C6B] flex flex-col justify-center items-center text-center gap-4 hover:-translate-y-2 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl group book-entry relative overflow-hidden`}
                            onClick={() => setShowImportModal(true)}>
                         <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                         <div className="w-12 h-12 bg-[#3E1519] rounded-xl flex items-center justify-center shadow-inner mb-2 group-hover:bg-[#8F7C6B] transition-colors duration-300">
                           <FileAudio className={`${easyMode ? 'w-8 h-8' : 'w-6 h-6'} text-[#E5DACD] group-hover:text-white transition-colors`} />
                         </div>
                         <h3 className={`${easyMode ? 'text-2xl' : 'text-lg'} font-bold text-white font-serif leading-tight z-10`}>
                           {easyMode ? 'Import Audio' : <>Import<br/>Legacy</>}
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
        <div className="mt-10 animate-fade-in-up p-12 bg-[#3E1519] rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c9a174]/10 to-transparent"></div>
          <div className="bg-[#2B0E11] p-6 rounded-2xl mb-8 border border-white/10 shadow-inner relative z-10">
            <BookOpen className="w-12 h-12 text-[#c9a174]" />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 font-serif relative z-10 drop-shadow-md">Your library starts here.</h2>
          <p className="text-xl text-[#E5DACD] mb-16 max-w-xl leading-relaxed relative z-10">Capture your first memory. You can record it just by speaking, or write it directly down in your digital journal.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full justify-center max-w-4xl px-4 relative z-10">
            <button 
              onClick={() => setShowVoiceRecorder(true)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-[#2B0E11] hover:bg-[#c9a174] border border-white/10 hover:border-transparent rounded-2xl transition-all duration-300 group shadow-xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(201,161,116,0.3)]"
            >
              <div className="bg-[#3E1519] p-5 rounded-full text-[#c9a174] shadow-inner group-hover:bg-white/90 group-hover:text-[#2B0E11] transition-colors">
                <Mic className="w-8 h-8" />
              </div>
              <span className="font-bold text-white group-hover:text-[#1e1a17] text-xl font-serif transition-colors">Record Audio</span>
            </button>

            <button 
              onClick={() => setShowWriteModal(true)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-br from-[#c9a174] to-[#8F7C6B] hover:to-[#c9a174] border border-transparent hover:border-white/50 rounded-2xl transition-all duration-300 group shadow-xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(201,161,116,0.3)]"
            >
              <div className="bg-white/20 backdrop-blur-sm p-5 rounded-full text-white shadow-inner group-hover:bg-white transition-colors">
                <PenTool className="w-8 h-8 group-hover:text-[#8F7C6B]" />
              </div>
              <span className="font-bold text-white text-xl font-serif">Write Story</span>
            </button>

            <button 
              onClick={() => setShowImportModal(true)}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-[#2B0E11] border border-white/10 hover:border-[#c9a174] rounded-2xl transition-all duration-300 group shadow-xl hover:-translate-y-2"
            >
              <div className="bg-[#3E1519] p-5 rounded-full text-[#8F7C6B] shadow-inner group-hover:text-[#c9a174] group-hover:scale-110 transition-transform flex items-center justify-center">
                <FileAudio className="w-8 h-8" />
              </div>
              <span className="font-bold text-white text-xl font-serif">Import Legacy</span>
            </button>
          </div>
        </div>
      )}

      {/* Gallery Footer Decorative Element */}
      {!loading && (
        <div className="mt-32 mb-8 pt-12 border-t border-[#3E1519]/10 text-center flex flex-col items-center animate-fade-in-up delay-700">
          <div className="flex items-center gap-3 mb-6 opacity-60">
             <span className="w-16 h-[1px] bg-[#4A0E17]"></span>
             <span className="w-1.5 h-1.5 rounded-full bg-[#c9a174]"></span>
             <span className="w-2.5 h-2.5 rounded-full bg-[#c9a174] shadow-sm"></span>
             <span className="w-1.5 h-1.5 rounded-full bg-[#c9a174]"></span>
             <span className="w-16 h-[1px] bg-[#4A0E17]"></span>
          </div>
          <p className="font-serif text-[#4A0E17]/70 italic tracking-wide text-xl">Your legacy is safe here.</p>
          <p className="text-xs text-[#4A0E17]/40 uppercase tracking-widest mt-6 font-bold">Let Me Tell You © {new Date().getFullYear()}</p>
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

      {showImportModal && (
        <ImportAudioModal
          session={session}
          groups={groups}
          onClose={() => setShowImportModal(false)}
          onSaveSuccess={() => {
            fetchStories();
            onGroupRefresh?.();
          }}
        />
      )}
    </main>
  );
}
