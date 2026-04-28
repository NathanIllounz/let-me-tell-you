import { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Search, UserCheck, UserMinus } from 'lucide-react';
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
    const headers = { Authorization: `Bearer ${session.access_token}` };
    
    try {
      const [profileRes, friendsRes, requestsRes] = await Promise.all([
        api.get('/friends/me', { headers }).catch(e => { console.error(e); return { data: null }; }),
        api.get('/friends/all', { headers }).catch(e => { console.error(e); return { data: [] }; }),
        api.get('/friends/pending', { headers }).catch(e => { console.error(e); return { data: [] }; })
      ]);
      
      if (profileRes.data) setMyProfile(profileRes.data);
      if (friendsRes.data) setFriends(friendsRes.data);
      if (requestsRes.data) setRequests(requestsRes.data);
    } catch (e) {
      console.error("Failed to load social data", e);
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

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      await api.delete(`/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchSocialData();
    } catch (err) {
      console.error("Failed to remove friend:", err);
      alert("Failed to remove friend.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] rounded-2xl shadow-2xl border border-[#D6C2A8] w-full max-w-lg overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between p-6 border-b border-[#D6C2A8] bg-[#F3E1CE]/80">
          <div className="flex items-center gap-3">
            <Users className="text-[#4A0E17] w-6 h-6" />
            <h2 className="text-xl font-bold text-[#4A0E17] font-serif">Social Hub</h2>
          </div>
          <button onClick={onClose} className="p-2 text-[#8C7A6B] hover:text-[#4A0E17] hover:bg-[#E5DACD] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#3E1519] to-[#2B0E11] text-[#E5DACD] flex items-center justify-between shadow-inner">
          <div className="flex flex-col">
            <span className="text-[#c9a174] text-xs font-bold uppercase tracking-wider mb-1">Your Unique Handle</span>
            {myProfile ? (
               <span className="text-2xl font-bold tracking-tight text-white">
                 {myProfile.username}<span className="text-[#8C7A6B] font-medium">#{myProfile.tag}</span>
               </span>
            ) : (
               <span className="text-sm opacity-80">Loading handle...</span>
            )}
          </div>
          <div className="p-2 bg-[#c9a174]/20 rounded-lg border border-[#c9a174]/30">
             <UserCheck className="w-6 h-6 text-[#c9a174]" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#D6C2A8] p-2 gap-2 bg-[#FDFBF7]">
          <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'friends' ? 'bg-[#F3E1CE] shadow-inner text-[#4A0E17] border border-[#D6C2A8]' : 'text-[#8C7A6B] hover:bg-[#F3EBE1] hover:text-[#4A0E17]'}`}
          >
            My Friends ({friends.length})
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'bg-[#F3E1CE] shadow-inner text-[#4A0E17] border border-[#D6C2A8]' : 'text-[#8C7A6B] hover:bg-[#F3EBE1] hover:text-[#4A0E17]'}`}
          >
            Requests 
            {requests.length > 0 && (
               <span className="bg-[#4A0E17] text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-[#3E1519] text-[#c9a174] shadow-md border border-[#2B0E11]' : 'text-[#8C7A6B] hover:bg-[#F3EBE1] hover:text-[#4A0E17]'}`}
          >
            Add Friend
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FDFBF7]">
          {loading ? (
             <div className="flex justify-center items-center h-full text-[#8C7A6B] font-serif italic">Loading social graph...</div>
          ) : (
             <>
               {activeTab === 'friends' && (
                 <div className="space-y-3">
                   {friends.length === 0 ? (
                      <p className="text-center text-[#8C7A6B] text-sm italic mt-10">You haven't added any friends yet.</p>
                   ) : (
                     friends.map(friend => (
                       <div key={friend.id} className="flex items-center justify-between p-4 bg-white border border-[#D6C2A8] shadow-sm rounded-xl hover:shadow-md transition-shadow">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-[#F3EBE1] flex items-center justify-center border border-[#D6C2A8]">
                             <UserCheck className="w-5 h-5 text-[#8C7A6B]" />
                           </div>
                           <span className="font-bold text-[#4A3D33]">
                              {friend.username}<span className="text-[#8C7A6B] font-normal">#{friend.tag}</span>
                           </span>
                         </div>
                         <button 
                            onClick={() => handleRemoveFriend(friend.id)}
                            className="p-2 text-[#8C7A6B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Remove Friend"
                         >
                            <UserMinus className="w-5 h-5" />
                         </button>
                       </div>
                     ))
                   )}
                 </div>
               )}

               {activeTab === 'requests' && (
                 <div className="space-y-3">
                   {requests.length === 0 ? (
                      <p className="text-center text-[#8C7A6B] text-sm italic mt-10">No pending friend requests.</p>
                   ) : (
                     requests.map(req => (
                       <div key={req.request_id} className="flex items-center justify-between p-4 bg-white border border-[#D6C2A8] shadow-sm rounded-xl">
                         <div className="flex flex-col">
                           <span className="font-bold text-[#4A3D33]">
                              {req.sender_username}<span className="text-[#8C7A6B] font-normal">#{req.sender_tag}</span>
                           </span>
                           <span className="text-[10px] text-[#8C7A6B] uppercase font-bold tracking-wider mt-1">Wants to connect</span>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={() => handleAccept(req.request_id)} className="p-2 bg-[#F3EBE1] text-[#4A0E17] hover:bg-[#c9a174] hover:text-white rounded-lg transition-colors border border-[#D6C2A8]" title="Accept">
                             <Check className="w-5 h-5" />
                           </button>
                           <button onClick={() => handleDecline(req.request_id)} className="p-2 bg-[#FDFBF7] text-[#8C7A6B] hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-[#D6C2A8]" title="Decline">
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
                   <div className="bg-white p-6 rounded-xl border border-[#D6C2A8] shadow-sm">
                     <h3 className="font-bold text-[#4A0E17] font-serif text-lg mb-2">Add a Companion</h3>
                     <p className="text-sm text-[#8C7A6B] leading-relaxed mb-4">
                       Enter your friend's exact username and tag (e.g. <strong>sarah#1425</strong>) to send them a secure request.
                     </p>
                     
                     <form onSubmit={handleSendRequest} className="flex gap-2">
                       <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                         <input 
                           type="text"
                           value={searchHandle}
                           onChange={(e) => setSearchHandle(e.target.value)}
                           className="w-full pl-9 pr-4 py-3 bg-[#FDFBF7] border border-[#D6C2A8] rounded-xl focus:ring-2 focus:ring-[#c9a174] focus:border-[#c9a174] outline-none transition-all text-sm font-medium text-[#4A3D33]"
                           placeholder="username#0000"
                         />
                       </div>
                       <button type="submit" className="px-5 py-3 bg-[#3E1519] text-[#E5DACD] rounded-xl font-bold hover:bg-[#561C24] transition-colors shadow-sm flex items-center gap-2">
                         <UserPlus className="w-4 h-4" />
                         Send
                       </button>
                     </form>
                   </div>
                   
                   {actionError && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-lg text-center shadow-inner">{actionError}</div>
                   )}
                   {actionMessage && (
                      <div className="p-3 bg-[#F3EBE1] border border-[#c9a174] text-[#4A0E17] text-sm font-bold rounded-lg text-center flex items-center justify-center gap-2 shadow-inner">
                         <Check className="w-4 h-4 text-[#c9a174]"/> {actionMessage}
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
