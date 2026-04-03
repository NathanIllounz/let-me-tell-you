import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function Auth({ supabase }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 w-full h-full my-8 bg-red-500 p-10">
      <div className="max-w-md w-full p-10 bg-white rounded-2xl shadow-xl border border-stone-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-stone-800 font-serif tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-stone-500 mt-3 text-lg">
            {mode === 'login' ? 'Log in to access your memories.' : 'Sign up to start saving your stories.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center w-full py-3 px-4 border border-stone-300 rounded-lg hover:bg-stone-50 transition-all font-medium text-stone-700 text-lg gap-3 mb-8 disabled:opacity-50 shadow-sm"
        >
          {/* Official Google 'G' SVG Logo */}
          <svg fill="currentColor" width="24" height="24" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center py-2 mb-8">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink-0 mx-4 text-stone-400 text-base">Or continue with email</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-base rounded-lg border border-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="p-4 bg-green-50 text-green-700 text-base rounded-lg border border-green-200">
              {message}
            </div>
          )}

          <div>
            <label className="block text-base font-medium text-stone-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-6 w-6 text-stone-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 w-full p-3 text-lg border border-stone-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-stone-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-6 w-6 text-stone-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 w-full p-3 text-lg border border-stone-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-indigo-900 hover:bg-indigo-950 text-white font-medium py-3.5 px-6 rounded-lg transition-colors disabled:opacity-50 text-lg mt-4 shadow-sm"
          >
            {mode === 'login' ? (
              <><LogIn className="w-6 h-6"/> Log In</>
            ) : (
              <><UserPlus className="w-6 h-6"/> Sign Up</>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-stone-600 hover:text-indigo-800 transition-colors text-base font-medium underline underline-offset-4"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}
