import { useState } from 'react';
import { X, Sparkles, Save, RefreshCw } from 'lucide-react';
import api from '../api';

export default function ManualEntry({ session, onClose, onSaveSuccess }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [shouldRefine, setShouldRefine] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill out both the title and your memory.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // NOTE on API Paths: 
      // The backend uses POST `/stories/manual` expecting `{ title, content, should_refine }`.
      // Sending to `/stories/manual` guarantees success, while `/upload-text` throws a 404 because it doesn't exist in the FastAPI router.
      const payload = {
        title: title,
        content: content,
        should_refine: shouldRefine,
        // Added these fields per your request so they are passed along just in case! 
        story_content: content,
        user_id: session?.user?.id
      };

      await api.post('/stories/manual', payload, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      // Success Handling: clear form, close modal, refresh story list
      setTitle('');
      setContent('');
      setShouldRefine(true);
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error("Save failed:", err.response?.status, err.response?.data || err.message);
      setError("Failed to save memory. Check console for exact error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-2xl font-bold text-stone-800 font-serif">Write a Memory</h2>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow"
              placeholder="e.g., The summer of 1985..."
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[200px]">
            <label className="block text-sm font-medium text-stone-700 mb-2">Your Story</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 p-4 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow resize-none"
              placeholder="Start writing..."
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <input 
              type="checkbox"
              id="refineToggle"
              checked={shouldRefine}
              onChange={(e) => setShouldRefine(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 text-indigo-600 rounded border-stone-300 focus:ring-indigo-500 transition-all cursor-pointer"
            />
            <label htmlFor="refineToggle" className="flex items-center gap-2 cursor-pointer select-none text-stone-700 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              ✨ Use Gemini to polish this story
            </label>
          </div>
        </form>

        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-stone-600 hover:bg-stone-200 bg-stone-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving...' : 'Save Memory'}
          </button>
        </div>
      </div>
    </div>
  );
}
