import { ArrowLeft, PlayCircle, Sparkles, PauseCircle, FastForward, Rewind, Play, Settings, Edit3, X, Save, RefreshCw } from 'lucide-react';
import { useState, useRef } from 'react';
import api from '../api';
import StoryMetadataModal from './StoryMetadataModal';

export default function StoryDetail({ story, session, groups, onBack, onUpdate }) {
  const hasOriginalAudio = story.audio_path && !story.audio_path.endsWith('manual_entry');
  const hasNarratorAudio = !!story.refined_audio_path;
  const [activeTrack, setActiveTrack] = useState(hasNarratorAudio ? 'narrator' : 'original');
  
  const currentAudioSrc = activeTrack === 'narrator' ? story.refined_audio_path : (hasOriginalAudio ? story.audio_path : null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  
  const [showMetadataSettings, setShowMetadataSettings] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedContent, setEditedContent] = useState(story.refined_story || '');
  const [savingText, setSavingText] = useState(false);
  const [generatingNarrator, setGeneratingNarrator] = useState(false);
  const [narratorGender, setNarratorGender] = useState(session?.user?.user_metadata?.gender || 'female');
  const isOwner = story.user_id === session?.user?.id;

  const handleGenerateNarrator = async () => {
    setGeneratingNarrator(true);
    try {
      const res = await api.post(`/stories/${story.id}/generate-audio`, null, { params: { user_id: session.user.id, gender: narratorGender } });
      const taskId = res.data.task_id;
      
      const pollTimer = setInterval(async () => {
         try {
            const taskRes = await api.get(`/tasks/${taskId}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (taskRes.data.status === 'completed') {
               clearInterval(pollTimer);
               // Fetch the updated story to get the signed audio url
               const storiesRes = await api.get('/stories', { params: { user_id: session.user.id } });
               const updatedStory = storiesRes.data.find(s => s.id === story.id);
               if (updatedStory) {
                  onUpdate(updatedStory);
                  setActiveTrack('narrator');
               }
               setGeneratingNarrator(false);
            } else if (taskRes.data.status === 'failed') {
               clearInterval(pollTimer);
               alert("Narrator generation failed on the server.");
               setGeneratingNarrator(false);
            }
         } catch (e) {
            console.error("Polling error", e);
         }
      }, 4000);
    } catch (e) {
      alert("Failed to queue narrator generation. Ensure you are the owner.");
      setGeneratingNarrator(false);
    }
  };

  const saveEditedContent = async () => {
    setSavingText(true);
    try {
      await api.put(`/stories/${story.id}`, {
        title: story.title,
        content: editedContent,
        user_id: session.user.id
      });
      onUpdate({ ...story, refined_story: editedContent });
      setIsEditingText(false);
    } catch (e) {
      alert("Failed to save text.");
    } finally {
      setSavingText(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (currentAudioSrc) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => setIsPlaying(false);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipForward = () => {
    if (audioRef.current) audioRef.current.currentTime += 10;
  };

  const skipBackward = () => {
    if (audioRef.current) audioRef.current.currentTime -= 10;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FDFCF7] py-16 px-6 sm:px-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="max-w-3xl mx-auto pb-20">
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors mb-16 font-medium tracking-wide uppercase text-sm border border-transparent hover:border-stone-200 px-4 py-2 rounded-full -ml-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gallery
        </button>

        {/* Header (Manuscript Style) */}
        <header className="text-center mb-16 relative group">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs uppercase tracking-[0.2em] font-medium text-stone-400">
            {story.created_at && (
              <p>
                {new Date(story.created_at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            {story.language && (
               <>
                 {story.created_at && <span>•</span>}
                 <p className="px-2 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200">{story.language}</p>
               </>
            )}
          </div>
          
          {isOwner && (
            <button 
              onClick={() => setShowMetadataSettings(true)}
              className="absolute top-0 right-0 p-2 text-stone-300 hover:text-stone-600 bg-white border border-transparent hover:border-stone-200 rounded-full transition-all"
              title="Story Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {story.cover_url && (
             <div className="flex justify-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <img 
                   src={story.cover_url} 
                   alt={`${story.title} Cover`} 
                   className="w-56 h-auto max-h-80 object-cover rounded-md shadow-2xl border border-stone-200/60"
                />
             </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-bold text-stone-800 font-serif leading-tight sm:leading-tight mb-10 mx-auto max-w-2xl px-8">
            {story.title || "Untitled Memory"}
          </h1>
          
          {/* Action Buttons & Player */}
          {/* Player Configuration */}
          <div className="mt-12 pt-10 border-t border-stone-200/60 max-w-xl mx-auto">
            
            {(hasOriginalAudio && hasNarratorAudio) && (
              <div className="flex justify-center mb-6 bg-stone-100 p-1 rounded-full items-center max-w-xs mx-auto">
                <button 
                  onClick={() => { setIsPlaying(false); setActiveTrack('original'); }}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTrack === 'original' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Original
                </button>
                <button 
                  onClick={() => { setIsPlaying(false); setActiveTrack('narrator'); }}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTrack === 'narrator' ? 'bg-white shadow-sm text-indigo-600' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  <Sparkles className="w-4 h-4 inline-block mr-1 -mt-1"/> Narrator
                </button>
              </div>
            )}

            {currentAudioSrc ? (
              <div className="bg-white border border-stone-200 shadow-sm rounded-2xl p-5 mb-6 animate-in fade-in zoom-in-95 duration-300">
                <audio 
                  ref={audioRef}
                  src={currentAudioSrc} 
                  onEnded={handleAudioEnded}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="hidden"
                  preload="metadata"
                />
                
                {/* Progress Bar */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium text-stone-400 w-10 text-right">{formatTime(currentTime)}</span>
                  <input 
                    type="range" 
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none ${activeTrack === 'narrator' ? 'bg-indigo-100 accent-indigo-600' : 'bg-stone-200 accent-emerald-600'}`}
                  />
                  <span className="text-xs font-medium text-stone-400 w-10">{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button onClick={skipBackward} className="text-stone-400 hover:text-stone-700 transition-colors">
                    <Rewind className="w-5 h-5" />
                  </button>
                  
                  <button 
                    onClick={togglePlay}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors border ${activeTrack === 'narrator' ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100'}`}
                  >
                    {isPlaying ? <PauseCircle className="w-7 h-7" /> : <PlayCircle className="w-7 h-7 ml-0.5" />}
                  </button>
                  
                  <button onClick={skipForward} className="text-stone-400 hover:text-stone-700 transition-colors">
                    <FastForward className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
               <div className="flex justify-center mt-6">
                 {generatingNarrator ? (
                    <div className="flex items-center gap-2 px-5 py-3 bg-stone-50 border border-stone-200 text-stone-500 rounded-full text-sm font-medium animate-pulse">
                       <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
                       <span>Generating Narrator Audio...</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2">
                      <select 
                        value={narratorGender} 
                        onChange={(e) => setNarratorGender(e.target.value)}
                        className="pl-3 pr-8 py-3 bg-white border border-stone-200 text-stone-600 rounded-full text-sm font-medium outline-none shadow-sm cursor-pointer appearance-none"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                      <button 
                        onClick={handleGenerateNarrator}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold transition-all shadow-sm border border-indigo-200"
                      >
                        <Sparkles className="w-4 h-4"/>
                        Generate Narrator Voice
                      </button>
                    </div>
                 )}
               </div>
            )}
            
            {hasOriginalAudio && !hasNarratorAudio && (
               <div className="flex justify-center mt-6">
                 {generatingNarrator ? (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50/50 border border-indigo-100 text-indigo-400 rounded-full text-xs font-medium">
                       <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                       <span>AI Narrator processing...</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2">
                      <select 
                        value={narratorGender} 
                        onChange={(e) => setNarratorGender(e.target.value)}
                        className="pl-3 pr-8 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-medium outline-none shadow-sm cursor-pointer appearance-none"
                      >
                        <option value="female">Female Voice</option>
                        <option value="male">Male Voice</option>
                      </select>
                      <button 
                        onClick={handleGenerateNarrator}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full text-xs font-bold transition-all shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5"/>
                        Generate Narrator AI
                      </button>
                    </div>
                 )}
               </div>
            )}

          </div>
        </header>

        {/* The Story Content */}
        <article 
          className="prose prose-stone prose-lg sm:prose-xl max-w-none mt-16 px-4 sm:px-0 relative group"
          dir={story.language === 'Hebrew' ? 'rtl' : 'ltr'}
        >
          {isOwner && (
            <div className="absolute -top-12 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setIsEditingText(!isEditingText);
                  if (!isEditingText) setEditedContent(story.refined_story || '');
                }}
                className="flex items-center gap-2 p-2 px-3 text-stone-500 hover:text-stone-800 bg-white border border-stone-200 rounded-lg shadow-sm transition-all text-sm font-medium"
              >
                {isEditingText ? <X className="w-4 h-4"/> : <Edit3 className="w-4 h-4"/>}
                {isEditingText ? "Cancel" : "Edit Story"}
              </button>
            </div>
          )}

          {isEditingText ? (
            <div className="flex flex-col animate-in fade-in duration-300">
              <textarea 
                 className="w-full min-h-[400px] p-6 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-[1.15rem] sm:text-[1.25rem] leading-loose text-stone-700 font-serif resize-y shadow-inner bg-stone-50"
                 value={editedContent}
                 onChange={e => setEditedContent(e.target.value)}
              />
              <div className="flex justify-end mt-4">
                 <button 
                   onClick={saveEditedContent} 
                   disabled={savingText} 
                   className="px-6 py-2.5 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 transition flex items-center gap-2 disabled:opacity-50"
                 >
                     {savingText ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Text
                 </button>
              </div>
            </div>
          ) : (
            <p className={`font-serif leading-loose text-stone-700 whitespace-pre-wrap text-[1.15rem] sm:text-[1.25rem] selection:bg-indigo-100 selection:text-indigo-900 first-letter:text-6xl first-letter:font-bold first-letter:text-stone-800 tracking-wide ${story.language === 'Hebrew' ? 'first-letter:float-right first-letter:ml-3 text-right' : 'first-letter:float-left first-letter:mr-3 text-justify'}`}>
              {story.refined_story || "No text content available for this memory."}
            </p>
          )}
        </article>

        {/* Footer Stylized Marker */}
        <div className="mt-32 pt-12 border-t border-stone-200/60 text-center flex flex-col items-center">
          <div className="flex gap-2 mb-10 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
          </div>
          <button 
            onClick={onBack}
            className="text-stone-500 hover:text-stone-800 font-medium transition-colors border-b border-transparent hover:border-stone-800 pb-1"
          >
             Close Manuscript
          </button>
        </div>
      </div>
      
      {showMetadataSettings && (
        <StoryMetadataModal 
          story={story}
          session={session}
          groups={groups}
          onClose={() => setShowMetadataSettings(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
