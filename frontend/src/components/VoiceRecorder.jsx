import { useState, useRef } from 'react';
import { Mic, Square, Loader2, X, AlertCircle } from 'lucide-react';
import api from '../api';

export default function VoiceRecorder({ session, groups, onClose, onSaveSuccess }) {
  const [status, setStatus] = useState('idle'); // idle, recording, processing, error, success
  const [errorMessage, setErrorMessage] = useState('');
  const [groupIds, setGroupIds] = useState([]);
  const [language, setLanguage] = useState('English');
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        
        // Stop all tracks to turn off the microphone light immediately
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStatus('recording');
      setErrorMessage('');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setStatus('error');
      setErrorMessage("Microphone access denied or unavailable. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
    }
  };

  const uploadAudio = async (blob) => {
    const formData = new FormData();
    // Defaulting to .webm typically works across Chromium/Firefox MediaRecorder outputs
    formData.append('file', blob, 'recording.webm');
    
    // Pass user ID so backend respects Row Level Security and binds the story correctly
    if (session?.user?.id) {
      formData.append('user_id', session.user.id);
    }
    if (groupIds.length > 0) {
      formData.append('group_ids', JSON.stringify(groupIds));
    }
    formData.append('language', language);

    try {
      await api.post('/stories/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session.access_token}`
        }
      });
      setStatus('success');
      onSaveSuccess();
      setTimeout(() => {
         onClose();
      }, 1500);
    } catch (err) {
      console.error('Upload failed:', err);
      setStatus('error');
      setErrorMessage("Failed to process your memory. Our AI might be busy, or there was a network glitch.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-100 w-full max-w-md overflow-hidden relative">
        {(status === 'idle' || status === 'error') && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-10 flex flex-col items-center text-center mt-2">
          <h2 className="text-2xl font-bold text-stone-800 font-serif mb-3">Capture a Memory</h2>
          <p className="text-stone-500 mb-6 text-sm leading-relaxed">Speak naturally. Our AI will preserve your voice and generate a polished written story for you.</p>

          {(status === 'idle' || status === 'recording') && (
            <div className="w-full mb-8 text-left space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Who can see this?</label>
                <div className="w-full max-h-[120px] overflow-y-auto p-3 border border-stone-200 rounded-lg bg-stone-50 flex flex-col gap-2">
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
                        disabled={status !== 'idle'}
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Story Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-shadow bg-stone-50"
                  disabled={status !== 'idle'}
                >
                  <option value="English">English</option>
                  <option value="Hebrew">Hebrew</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center min-h-[160px] w-full">
            
            {status === 'idle' && (
              <button 
                onClick={startRecording}
                className="group relative flex flex-col items-center justify-center gap-5 transition-all"
              >
                <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border-[6px] border-rose-100 shadow-sm group-hover:scale-105 group-hover:bg-rose-100 group-hover:border-rose-200 transition-all duration-300">
                  <Mic className="w-10 h-10" />
                </div>
                <span className="font-bold text-stone-700 group-hover:text-rose-700 transition-colors tracking-wide">Start Recording</span>
              </button>
            )}

            {status === 'recording' && (
              <button 
                onClick={stopRecording}
                className="group flex flex-col items-center justify-center gap-6"
              >
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-30"></div>
                  <div className="absolute inset-0 bg-rose-100 rounded-full animate-pulse"></div>
                  <div className="w-20 h-20 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-700 hover:scale-95 transition-all z-10">
                    <Square className="w-8 h-8 fill-current" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-rose-600 animate-pulse tracking-widest uppercase text-sm">Recording...</span>
                  <span className="text-stone-500 text-xs mt-2 uppercase tracking-wider font-semibold">Tap square to stop</span>
                </div>
              </button>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border-4 border-indigo-100 shadow-inner">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="font-bold text-indigo-800 text-lg">Writing your memoir...</span>
                  <span className="text-stone-500 text-sm mt-2 leading-relaxed">Our AI is analyzing your voice and polishing your story. This takes about 10-20 seconds.</span>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center justify-center gap-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
                  <Mic className="w-8 h-8" />
                </div>
                <span className="font-bold text-emerald-700 text-xl font-serif">Memory Captured!</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center gap-4 w-full animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-1">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <span className="font-bold text-red-700">Oops, something went wrong</span>
                <p className="text-stone-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">{errorMessage}</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-3 px-6 py-2.5 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 transition-colors shadow-sm"
                >
                  Try Again
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
