import { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Search, UserCheck } from 'lucide-react';
import api from '../api';

export default function SocialCenter({ session, onClose }) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'add'
  const [myProfile, setMyProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchHandle, setSearchHandle] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchSocialData = async () => {
    setLoading(true);
    let myProf = null;
    try {
       const profileRes = await api.get('/friends/me', { headers: { Authorization: `Bearer ${session.access_token}` } });
       myProf = profileRes.data;
       setMyProfile(profileRes.data);
    } catch (e) {
       console.error("Failed to load profile", e);
    }

    try {
       const friendsRes = await api.get('/friends/all', { headers: { Authorization: `Bearer ${session.access_token}` } });
       setFriends(friendsRes.data || []);
    } catch (e) {
       console.error("Failed to load friends", e);
    }

    try {
       const requestsRes = await api.get('/friends/pending', { headers: { Authorization: `Bearer ${session.access_token}` } });
       setRequests(requestsRes.data || []);
    } catch (e) {
       console.error("Failed to load requests", e);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchSocialData();
  }, []);

  const clearMessages = () => {
    setActionMessage(null);
    setActionError(null);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!searchHandle.includes('#')) {
      setActionError("Handle must include a '#' followed by a 4-digit tag (e.g. nathan#1234)");
      return;
    }
    
    const [username, tag] = searchHandle.split('#');
    if (!username || !tag) {
       setActionError("Invalid handle format.");
       return;
    }

    try {
      const res = await api.post('/friends/request', { username: username.toLowerCase().trim(), tag: tag.trim() }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setActionMessage(res.data.message);
      setSearchHandle('');
      fetchSocialData();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Could not send friend request.");
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.post(`/friends/${requestId}/accept`, null, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchSocialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await api.post(`/friends/${requestId}/decline`, null, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchSocialData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-lg overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <Users className="text-indigo-500 w-6 h-6" />
            <h2 className="text-xl font-bold text-stone-800 font-serif">Social Hub</h2>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Banner */}
        <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between shadow-inner">
          <div className="flex flex-col">
            <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Your Unique Handle</span>
            {myProfile ? (
               <span className="text-2xl font-bold tracking-tight">
                 {myProfile.username}<span className="text-indigo-300 font-medium">#{myProfile.tag}</span>
               </span>
            ) : (
               <span className="text-sm opacity-80">Loading handle...</span>
            )}
          </div>
          <div className="p-2 bg-indigo-500/50 rounded-lg">
             <UserCheck className="w-6 h-6 text-indigo-100" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 p-2 gap-2 bg-stone-50/50">
          <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'friends' ? 'bg-white shadow-sm text-stone-800 border-stone-200' : 'text-stone-500 hover:bg-stone-100'}`}
          >
            My Friends ({friends.length})
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'bg-white shadow-sm text-stone-800 border-stone-200' : 'text-stone-500 hover:bg-stone-100'}`}
          >
            Requests 
            {requests.length > 0 && (
               <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-indigo-100' : 'text-stone-500 hover:bg-stone-100'}`}
          >
            Add Friend
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FDFBF7]">
          {loading ? (
             <div className="flex justify-center items-center h-full text-stone-400">Loading social graph...</div>
          ) : (
             <>
               {activeTab === 'friends' && (
                 <div className="space-y-3">
                   {friends.length === 0 ? (
                      <p className="text-center text-stone-500 text-sm italic mt-10">You haven't added any friends yet.</p>
                   ) : (
                     friends.map(friend => (
                       <div key={friend.id} className="flex items-center justify-between p-4 bg-white border border-stone-100 shadow-sm rounded-xl">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
                             <UserCheck className="w-5 h-5 text-stone-500" />
                           </div>
                           <span className="font-bold text-stone-700">
                              {friend.username}<span className="text-stone-400 font-normal">#{friend.tag}</span>
                           </span>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               )}

               {activeTab === 'requests' && (
                 <div className="space-y-3">
                   {requests.length === 0 ? (
                      <p className="text-center text-stone-500 text-sm italic mt-10">No pending friend requests.</p>
                   ) : (
                     requests.map(req => (
                       <div key={req.request_id} className="flex items-center justify-between p-4 bg-white border border-stone-100 shadow-sm rounded-xl">
                         <div className="flex flex-col">
                           <span className="font-bold text-stone-700">
                              {req.sender_username}<span className="text-stone-400 font-normal">#{req.sender_tag}</span>
                           </span>
                           <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mt-1">Wants to connect</span>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={() => handleAccept(req.request_id)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100" title="Accept">
                             <Check className="w-5 h-5" />
                           </button>
                           <button onClick={() => handleDecline(req.request_id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100" title="Decline">
                             <X className="w-5 h-5" />
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               )}

               {activeTab === 'add' && (
                 <div className="space-y-6">
                   <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                     <h3 className="font-bold text-stone-800 mb-2">Add a Companion</h3>
                     <p className="text-sm text-stone-500 leading-relaxed mb-4">
                       Enter your friend's exact username and tag (e.g. <strong>sarah#1425</strong>) to send them a secure request.
                     </p>
                     
                     <form onSubmit={handleSendRequest} className="flex gap-2">
                       <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                         <input 
                           type="text"
                           value={searchHandle}
                           onChange={(e) => setSearchHandle(e.target.value)}
                           className="w-full pl-9 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                           placeholder="username#0000"
                         />
                       </div>
                       <button type="submit" className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                         <UserPlus className="w-4 h-4" />
                         Send
                       </button>
                     </form>
                   </div>
                   
                   {actionError && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-lg text-center">{actionError}</div>
                   )}
                   {actionMessage && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium rounded-lg text-center flex items-center justify-center gap-2">
                         <Check className="w-4 h-4"/> {actionMessage}
                      </div>
                   )}
                 </div>
               )}
             </>
          )}
        </div>
      </div>
    </div>
  );
}
