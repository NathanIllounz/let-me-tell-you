import { useEffect, useState } from 'react';
import { BookOpen, LogOut, User, Settings, Users, Feather } from 'lucide-react';
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
    <div className={`bg-[#F3E1CE] relative min-h-screen text-[#4A3D33] font-sans font-medium transition-all duration-300 ${easyMode ? 'text-lg font-semibold' : ''}`}>
      {/* Subtle vintage library texture overlay */}
      <div className="fixed inset-0 z-0 bg-[#F3E1CE] pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=2000&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}></div>
      </div>

      <header className="bg-white/80 backdrop-blur-md border-b border-[#D6C2A8] shadow-sm sticky top-0 z-30 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4 w-1/3">
           {/* Composite Logo */}
           <div className="relative w-10 h-10 flex items-center justify-center p-1 bg-gradient-to-br from-[#c9a174] to-[#8F7C6B] rounded-lg shadow-md border border-white/20">
             <BookOpen className="text-white/80 w-5 h-5 absolute mt-1 ml-0.5" strokeWidth={1.5} />
             <Feather className="text-white w-6 h-6 absolute -mt-2 mr-1 rotate-[15deg] drop-shadow-sm" strokeWidth={2.5} />
           </div>
          <h1 
            className="hidden sm:block text-2xl font-bold tracking-tight text-[#4A3D33] font-serif cursor-pointer hover:text-[#8C7A6B] transition-colors" 
            onClick={() => setSelectedStory(null)}
          >
            Let Me Tell You
          </h1>
        </div>

        {/* Decorative Quote Center */}
        <div className="hidden lg:flex w-1/3 flex-col items-center justify-center opacity-80">
           <span className="font-serif italic text-sm text-[#4A0E17]">"What we keep in memory is ours unchanged forever."</span>
           <div className="flex items-center gap-2 mt-1.5">
              <span className="w-10 h-[1px] bg-[#c9a174]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a174]"></span>
              <span className="w-10 h-[1px] bg-[#c9a174]"></span>
           </div>
        </div>
        
        {session && (
          <div className="flex items-center justify-end gap-3 sm:gap-6 w-1/3">
            <button 
              onClick={() => setEasyMode(!easyMode)}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-full border-2 transition-all shadow-md font-bold text-sm tracking-widest uppercase ${easyMode ? 'bg-[#c9a174] border-transparent text-[#1e1a17] scale-105' : 'bg-[#3E1519] border-[#561C24] text-[#E5DACD] hover:bg-[#561C24] hover:shadow-lg'}`}
              title="Toggle Easy Mode"
            >
              <span className="text-xl leading-none">👓</span>
              <span className="hidden sm:inline">{easyMode ? 'Exit Easy Mode' : 'Easy Mode'}</span>
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
        <div className="relative z-10">
          <StoryDetail 
            story={selectedStory} 
            session={session}
            groups={groups}
            easyMode={easyMode}
            onBack={() => { setSelectedStory(null); fetchGroups(); }} 
            onUpdate={(updated) => setSelectedStory(updated)}
          />
        </div>
      ) : (
        <div className="flex max-w-[1400px] mx-auto w-full relative z-10">
          {!easyMode && (
            <aside className="hidden md:block w-80 border-r border-[#561C24] min-h-[calc(100vh-80px)] p-8 bg-[#3E1519] text-[#E5DACD] shadow-[20px_0_40px_-20px_rgba(0,0,0,0.4)] relative z-20">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#561C24]">
                <h3 className="font-bold text-white font-serif text-xl tracking-wide">My Circles</h3>
                <button 
                  onClick={() => setShowGroupsModal(true)}
                  className="w-8 h-8 rounded-full bg-[#2B0E11] hover:bg-[#c9a174] flex items-center justify-center text-[#c9a174] hover:text-[#1e1a17] transition-all border border-[#561C24] hover:border-transparent shadow-inner font-bold"
                  title="Add/Join Circle"
                >
                  +
                </button>
              </div>
              
              <ul className="space-y-3">
                <li 
                  onClick={() => setActiveView('all')}
                  className={`cursor-pointer px-4 py-3 rounded-xl shadow-md text-sm font-bold flex items-center gap-3 transition-all ${activeView === 'all' ? 'bg-[#c9a174] text-[#1e1a17] scale-[1.02]' : 'bg-[#2B0E11] border border-white/5 text-[#D6C2A8] hover:bg-[#561C24] hover:text-white'}`}
                >
                  <BookOpen className="w-5 h-5" />
                  All Stories
                </li>
                <li 
                  onClick={() => setActiveView('my_memories')}
                  className={`cursor-pointer px-4 py-3 rounded-xl shadow-md text-sm font-bold flex items-center gap-3 transition-all ${activeView === 'my_memories' ? 'bg-[#c9a174] text-[#1e1a17] scale-[1.02]' : 'bg-[#2B0E11] border border-white/5 text-[#D6C2A8] hover:bg-[#561C24] hover:text-white'}`}
                >
                  <User className="w-5 h-5" />
                  My Memories
                </li>
                <li 
                  onClick={() => setShowSocialCenter(true)}
                  className="cursor-pointer px-4 py-3 rounded-xl shadow-md text-sm font-bold flex items-center gap-3 transition-all bg-[#2B0E11] border border-white/5 text-[#D6C2A8] hover:bg-[#561C24] hover:text-white"
                >
                  <Users className={`w-5 h-5 ${activeView !== 'my_memories' && activeView !== 'all' ? 'text-[#c9a174]' : ''}`} />
                  My Friends
                </li>
                
                <div className="pt-6 pb-2 text-xs font-bold text-[#c9a174] uppercase tracking-[0.2em]">Family Circles</div>
                
                
                {groups.map(g => (
                  <li 
                    key={g.id} 
                    onClick={() => setActiveView(g.id)}
                    className={`cursor-pointer px-4 py-3 rounded-xl shadow-md text-sm font-bold flex items-center gap-3 transition-all ${activeView === g.id ? 'bg-[#c9a174] text-[#1e1a17] scale-[1.02]' : 'bg-[#2B0E11] border border-white/5 text-[#D6C2A8] hover:bg-[#561C24] hover:text-white'}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${activeView === g.id ? 'bg-white' : 'bg-[#c9a174]'}`}></span>
                    {g.name}
                  </li>
                ))}
                {groups.length === 0 && (
                  <li className="text-sm text-[#D6C2A8] italic text-center py-6 border border-dashed border-[#561C24] rounded-xl font-medium">No circles yet.</li>
                )}
              </ul>
              <button 
                onClick={() => setShowGroupsModal(true)}
                className="mt-6 w-full py-4 border-2 border-dashed border-[#561C24] rounded-xl text-[#c9a174] text-sm font-bold hover:bg-[#c9a174] hover:border-transparent hover:text-[#1e1a17] transition-colors uppercase tracking-widest"
              >
                + Join / Create
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
