import { useEffect, useState } from 'react';
import { BookOpen, LogOut, User, Settings, Users } from 'lucide-react';
import { supabase } from './supabaseClient';
import api from './api';
import Auth from './components/Auth';
import Gallery from './components/Gallery';
import StoryDetail from './components/StoryDetail';
import SettingsModal from './components/SettingsModal';
import FamilyGroups from './components/FamilyGroups';
import SocialCenter from './components/SocialCenter';
import LandingPage from './components/LandingPage';

function App() {
  const [session, setSession] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [groups, setGroups] = useState([]);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showSocialCenter, setShowSocialCenter] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all', 'my_memories', or group_id
  const [easyMode, setEasyMode] = useState(false);

  const fetchGroups = async () => {
    if (!session?.user?.id) return;
    try {
      const response = await api.get(`/groups?user_id=${session.user.id}`);
      setGroups(response.data);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [session?.user?.id]);

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setSelectedStory(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <LandingPage supabase={supabase} />;
  }

  return (
    <div className={`bg-[#FDFBF7] min-h-screen text-[#4A3D33] font-sans font-medium transition-all duration-300 ${easyMode ? 'text-lg font-semibold' : ''}`}>
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E5DACD] shadow-sm sticky top-0 z-10 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-[#8C7A6B] w-6 h-6" />
          <h1 
            className="text-2xl font-bold tracking-tight text-[#4A3D33] font-serif cursor-pointer hover:text-[#8C7A6B] transition-colors" 
            onClick={() => setSelectedStory(null)}
          >
            Let Me Tell You
          </h1>
        </div>
        
        {session && (
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => setEasyMode(!easyMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${easyMode ? 'bg-indigo-100 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 shadow-sm'}`}
              title="Toggle Easy Mode"
            >
              <span className="text-xl">👓</span>
              <span className="hidden sm:inline font-bold">Easy Mode</span>
            </button>
            
            {!easyMode && (
              <>
                <div className="flex items-center gap-2">
                  <div className="bg-stone-100 p-1.5 rounded-full border border-stone-200 hidden sm:block">
                    <User className="w-4 h-4 text-stone-500" />
                  </div>
                  <span className="text-sm font-medium text-stone-600 truncate max-w-[150px] sm:max-w-[200px]">
                    {session.user.user_metadata?.full_name || session.user.email}
                  </span>
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="text-stone-400 hover:text-stone-700 transition-colors ml-1 p-1.5 hover:bg-stone-100 rounded-full" 
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="w-px h-6 bg-stone-200"></div>

                <button
                  onClick={() => supabase.auth.signOut()}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {selectedStory ? (
        <StoryDetail 
          story={selectedStory} 
          session={session}
          groups={groups}
          easyMode={easyMode}
          onBack={() => { setSelectedStory(null); fetchGroups(); }} 
          onUpdate={(updated) => setSelectedStory(updated)}
        />
      ) : (
        <div className="flex max-w-7xl mx-auto w-full">
          {!easyMode && (
            <aside className="hidden md:block w-64 border-r border-[#E5DACD] min-h-[calc(100vh-80px)] p-6 bg-[#FDFBF7]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#4A3D33] font-serif text-lg">My Circles</h3>
                <button 
                  onClick={() => setShowGroupsModal(true)}
                  className="w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors"
                  title="Add/Join Circle"
                >
                  +
                </button>
              </div>
              
              <ul className="space-y-2">
                <li 
                  onClick={() => setActiveView('all')}
                  className={`cursor-pointer px-3 py-2.5 rounded-lg shadow-sm text-sm font-medium flex items-center gap-2 transition-colors ${activeView === 'all' ? 'bg-[#5C4D42] text-white' : 'bg-white border border-[#E5DACD] text-[#4A3D33] hover:bg-[#F3EBE1]'}`}
                >
                  <BookOpen className="w-4 h-4" />
                  All Stories
                </li>
                <li 
                  onClick={() => setActiveView('my_memories')}
                  className={`cursor-pointer px-3 py-2.5 rounded-lg shadow-sm text-sm font-medium flex items-center gap-2 transition-colors ${activeView === 'my_memories' ? 'bg-[#6B8569] text-white' : 'bg-white border border-[#E5DACD] text-[#4A3D33] hover:bg-[#F3EBE1]'}`}
                >
                  <User className="w-4 h-4" />
                  My Memories
                </li>
                <li 
                  onClick={() => setShowSocialCenter(true)}
                  className="cursor-pointer px-3 py-2.5 rounded-lg shadow-sm text-sm font-medium flex items-center gap-2 transition-colors bg-white border border-[#E5DACD] text-[#4A3D33] hover:bg-[#F3EBE1]"
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  My Friends
                </li>
                
                <div className="pt-4 pb-2 text-xs font-bold text-stone-400 uppercase tracking-wider">Circles</div>
                
                
                {groups.map(g => (
                  <li 
                    key={g.id} 
                    onClick={() => setActiveView(g.id)}
                    className={`cursor-pointer px-3 py-2.5 rounded-lg shadow-sm text-sm font-medium flex items-center gap-2 transition-colors ${activeView === g.id ? 'bg-[#988467] text-white' : 'bg-white border border-[#E5DACD] text-[#4A3D33] hover:bg-[#F3EBE1]'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeView === g.id ? 'bg-[#D6CBBA]' : 'bg-[#C2B29A]'}`}></span>
                    {g.name}
                  </li>
                ))}
                {groups.length === 0 && (
                  <li className="text-sm text-stone-500 italic text-center py-4 border border-dashed border-stone-200 rounded-lg">No circles yet.</li>
                )}
              </ul>
              <button 
                onClick={() => setShowGroupsModal(true)}
                className="mt-4 w-full py-2 border border-dashed border-stone-300 rounded-lg text-stone-500 text-sm hover:bg-stone-100 transition-colors"
              >
                + Join or Create
              </button>
            </aside>
          )}
          
          <div className="flex-1 w-full min-w-0">
            <Gallery 
              session={session} 
              onSelectStory={setSelectedStory} 
              groups={groups} 
              onGroupRefresh={fetchGroups} 
              activeView={activeView}
              setActiveView={setActiveView}
              easyMode={easyMode}
            />
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsModal session={session} onClose={() => setShowSettings(false)} />
      )}
      
      {showGroupsModal && (
        <FamilyGroups 
          session={session} 
          groups={groups}
          onClose={() => setShowGroupsModal(false)}
          onGroupAdded={fetchGroups}
        />
      )}
      
      {showSocialCenter && (
        <SocialCenter session={session} onClose={() => setShowSocialCenter(false)} />
      )}
    </div>
  );
}

export default App;
