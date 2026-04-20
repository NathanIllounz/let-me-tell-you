import { useState } from 'react';
import { X, ImagePlus } from 'lucide-react';
import api from '../api';

export default function StoryMetadataModal({ story, session, groups, onClose, onUpdate }) {
  const [title, setTitle] = useState(story.title || '');
  const initialGroups = story.story_groups ? story.story_groups.map(sg => sg.group_id) : [];
  const [groupIds, setGroupIds] = useState(initialGroups);
  const [language, setLanguage] = useState(story.language || 'English');
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(story.cover_url || '');
  const [loading, setLoading] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);

  const handleGenerateAICover = async () => {
    setGeneratingCover(true);
    try {
      const res = await api.post(`/stories/${story.id}/generate-cover`, null, { params: { user_id: session.user.id } });
      const taskId = res.data.task_id;
      
      const pollTimer = setInterval(async () => {
         try {
            const taskRes = await api.get(`/tasks/${taskId}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (taskRes.data.status === 'completed') {
               clearInterval(pollTimer);
               // Fast re-fetch the single story from gallery to get the cover
               const storiesRes = await api.get('/stories', { params: { user_id: session.user.id } });
               const updatedStory = storiesRes.data.find(s => s.id === story.id);
               if (updatedStory && updatedStory.cover_url) {
                  setPreviewUrl(updatedStory.cover_url);
                  setCoverFile(null);
                  // Update parent State
                  onUpdate(updatedStory);
               }
               setGeneratingCover(false);
            } else if (taskRes.data.status === 'failed') {
               clearInterval(pollTimer);
               alert("AI Cover generation failed.");
               setGeneratingCover(false);
            }
         } catch (e) {
            console.error("Polling error", e);
         }
      }, 4000);
    } catch (e) {
      alert("Failed to queue cover generation. Ensure the story has a title.");
      setGeneratingCover(false);
    }
  };

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
        group_ids: groupIds,
        language,
        cover_url: finalCoverUrl
      });
      onUpdate({
         ...story,
         title,
         story_groups: groupIds.map(id => ({ group_id: id })),
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                 {generatingCover ? (
                    <div className="w-10 h-14 bg-indigo-50 border border-indigo-200 rounded animate-pulse shadow-sm"></div>
                 ) : previewUrl ? (
                    <img src={previewUrl} alt="Cover" className="w-10 h-14 object-cover rounded shadow-sm border border-stone-300" />
                 ) : (
                    <div className="w-10 h-14 bg-stone-100 border border-stone-200 rounded shadow-sm"></div>
                 )}
                 
                 <div className="flex flex-col gap-1.5 items-start">
                   <div className="flex gap-2 items-center">
                     <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-stone-300 shadow-sm bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-lg cursor-pointer transition-colors text-[11px] font-bold uppercase tracking-wider">
                        <ImagePlus className="w-3.5 h-3.5"/>
                        {previewUrl ? 'Change' : 'Upload'}
                        <input type="file" accept="image/*" onChange={handleCoverChange} disabled={loading || generatingCover} className="hidden" />
                     </label>
                     {previewUrl && !generatingCover && (
                        <button type="button" disabled={loading} onClick={() => { setPreviewUrl(''); setCoverFile(null); }} className="text-[11px] text-red-500 hover:text-red-700 font-medium px-2">Remove</button>
                     )}
                   </div>
                   
                   {!generatingCover ? (
                     <button 
                       type="button" 
                       onClick={handleGenerateAICover}
                       disabled={loading}
                       className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors uppercase tracking-wider shadow-sm mt-0.5"
                     >
                       ✨ Generate AI
                     </button>
                   ) : (
                     <div className="text-[11px] font-medium text-indigo-400 animate-pulse px-2 flex items-center gap-1">
                       Painting...
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Visibility</label>
            <div className="w-full max-h-[120px] overflow-y-auto p-2.5 border border-stone-300 shadow-sm rounded-lg bg-stone-50 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={groupIds.length === 0}
                  onChange={() => setGroupIds([])}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                Only Me (Private)
              </label>
              {groups?.map(g => (
                <label key={g.id} className="flex items-center gap-2 cursor-pointer text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={groupIds.includes(g.id)}
                    onChange={(e) => {
                      if (e.target.checked) setGroupIds(prev => [...prev, g.id]);
                      else setGroupIds(prev => prev.filter(id => id !== g.id));
                    }}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                  />
                  {g.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Language</label>
            <select 
              value={language} 
              disabled={true}
              className="w-full p-2.5 border border-stone-300 shadow-sm rounded-lg bg-stone-100 text-stone-500 cursor-not-allowed"
            >
              <option value="English">English</option>
              <option value="French">French</option>
              <option value="Hebrew">Hebrew</option>
            </select>
            <p className="text-[10px] text-stone-400 mt-1">Language is locked once a story is generated.</p>
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
