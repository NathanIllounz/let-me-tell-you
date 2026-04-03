import { useEffect, useState } from 'react';
import { BookOpen, LogOut, User, Settings } from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Gallery from './components/Gallery';
import StoryDetail from './components/StoryDetail';

function App() {
  const [session, setSession] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);

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

  return (
    <div className="bg-stone-50 min-h-screen text-stone-800 font-sans">
      <header className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-10 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-stone-600 w-6 h-6" />
          <h1 
            className="text-xl font-bold tracking-tight text-stone-800 cursor-pointer hover:text-stone-600 transition-colors" 
            onClick={() => setSelectedStory(null)}
          >
            📖 Let Me Tell You
          </h1>
        </div>
        
        {session && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-stone-100 p-1.5 rounded-full border border-stone-200 hidden sm:block">
                <User className="w-4 h-4 text-stone-500" />
              </div>
              <span className="text-sm font-medium text-stone-600 truncate max-w-[150px] sm:max-w-[200px]">
                {session.user.user_metadata?.full_name || session.user.email}
              </span>
              <button className="text-stone-400 hover:text-stone-700 transition-colors ml-1 p-1.5 hover:bg-stone-100 rounded-full" title="Settings">
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
          </div>
        )}
      </header>

      {!session ? (
        <div className="py-10">
          <Auth supabase={supabase} />
        </div>
      ) : selectedStory ? (
        <StoryDetail story={selectedStory} onBack={() => setSelectedStory(null)} />
      ) : (
        <Gallery session={session} onSelectStory={setSelectedStory} />
      )}
    </div>
  );
}

export default App;
