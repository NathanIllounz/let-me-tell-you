import { useState } from 'react';
import { X, ImagePlus } from 'lucide-react';
import api from '../api';

export default function StoryMetadataModal({ story, session, groups, onClose, onUpdate }) {
  const [title, setTitle] = useState(story.title || '');
  const [groupId, setGroupId] = useState(story.group_id || '');
  const [language, setLanguage] = useState(story.language || 'English');
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(story.cover_url || '');
  const [loading, setLoading] = useState(false);

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    try {
      let finalCoverUrl = previewUrl || null;
      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        const coverRes = await api.post('/stories/upload-cover', formData, {
          headers: {
             'Content-Type': 'multipart/form-data',
             Authorization: `Bearer ${session.access_token}`
          }
        });
        finalCoverUrl = coverRes.data.cover_url;
      }

      const response = await api.put(`/stories/${story.id}`, {
        title,
        content: story.refined_story, // We use the existing content since we're just updating metadata
        user_id: session.user.id,
        group_id: groupId || null,
        language,
        cover_url: finalCoverUrl
      });
      onUpdate({
         ...story,
         title,
         group_id: groupId || null,
         language,
         cover_url: finalCoverUrl
      });
      onClose();
    } catch (e) {
      alert("Failed to update story settings. Are you the owner?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold font-serif mb-6 text-stone-800">Story Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Cover Photo</label>
            <div className="flex items-center gap-4">
               {previewUrl && (
                  <img src={previewUrl} alt="Cover" className="w-10 h-14 object-cover rounded shadow-sm border border-stone-200" />
               )}
               <label className="flex items-center justify-center gap-2 px-3 py-1.5 border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg cursor-pointer transition-colors text-xs font-medium">
                  <ImagePlus className="w-4 h-4"/>
                  {previewUrl ? 'Change' : 'Upload'}
                  <input type="file" accept="image/*" onChange={handleCoverChange} disabled={loading} className="hidden" />
               </label>
               {previewUrl && (
                  <button type="button" disabled={loading} onClick={() => { setPreviewUrl(''); setCoverFile(null); }} className="text-xs text-red-500 hover:text-red-700 underline">Remove</button>
               )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Visibility</label>
            <select 
              value={groupId} 
              onChange={e => setGroupId(e.target.value)} 
              className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-50"
            >
              <option value="">Private (Only Me)</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Language</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)} 
              className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-50"
            >
              <option value="English">English</option>
              <option value="French">French</option>
              <option value="Hebrew">Hebrew</option>
            </select>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={loading} 
          className="w-full mt-8 bg-stone-800 text-white font-medium py-3 rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
