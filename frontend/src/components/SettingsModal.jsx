import { useState } from 'react';
import { X, Save, RefreshCw, Globe, KeyRound, User, Phone, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SettingsModal({ session, onClose }) {
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState(session?.user?.user_metadata?.language || 'en');
  const [fullName, setFullName] = useState(session?.user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(session?.user?.user_metadata?.phone || '');
  const [city, setCity] = useState(session?.user?.user_metadata?.city || '');
  const [dob, setDob] = useState(session?.user?.user_metadata?.dob || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const updates = {};
      
      if (password) {
        updates.password = password;
      }
      
      updates.data = { language, full_name: fullName, phone, city, dob };

      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) throw error;
      
      setMessage("Settings updated successfully!");
      if (password) {
          setPassword('');
      }
      
      // Auto-close after a short delay on success
      setTimeout(() => onClose(), 1500);
      
    } catch (err) {
      setError(err.message || "Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-xl font-bold text-stone-800 font-serif">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-sm">
              {message}
            </div>
          )}
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
              <KeyRound className="w-4 h-4" /> Change Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
              placeholder="Leave blank to keep current"
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
              <User className="w-4 h-4" /> Full Name
            </label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
              placeholder="Your Name"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <Phone className="w-4 h-4" /> Phone
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
                placeholder="+1 (555)..."
                disabled={loading}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <MapPin className="w-4 h-4" /> City
              </label>
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
                placeholder="City Name"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
              <Calendar className="w-4 h-4" /> Date of Birth
            </label>
            <input 
              type="date" 
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
              <Globe className="w-4 h-4" /> Language Preference
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow bg-white"
              disabled={loading}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="he">Hebrew</option>
            </select>
            <p className="text-xs text-stone-500 mt-2 text-justify">
              This language choice will be used for future app features (like AI narrations and interface translations). Currently saves to your profile.
            </p>
          </div>
          
          <div className="mt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-stone-600 hover:bg-stone-200 bg-stone-100 rounded-lg font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
