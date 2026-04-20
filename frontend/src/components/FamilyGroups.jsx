import { useState, useEffect } from 'react';
import { X, Users, Copy, Check, UsersRound } from 'lucide-react';
import api from '../api';

export default function FamilyGroups({ session, groups = [], onClose, onGroupAdded }) {
  const [activeTab, setActiveTab] = useState('join'); // 'join', 'create', or 'manage'
  
  // Create 
  const [groupName, setGroupName] = useState('');
  const [createdGroup, setCreatedGroup] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Manage
  const [selectedManageGroupId, setSelectedManageGroupId] = useState('');
  
  // Social Graph
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [inviteMessage, setInviteMessage] = useState(null);
  
  // Join
  const [inviteCode, setInviteCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch friends on load
    if (session?.access_token) {
       api.get('/friends/all', { headers: { Authorization: `Bearer ${session.access_token}` }})
          .then(res => setFriends(res.data || []))
          .catch(err => console.error(err));
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/groups', {
        name: groupName,
        user_id: session.user.id
      });
      setCreatedGroup(response.data);
      onGroupAdded?.();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim() || inviteCode.length < 6) {
      setError("Please enter a valid 6-character code");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await api.post('/groups/join', {
        invite_code: inviteCode,
        user_id: session.user.id
      });
      onGroupAdded?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to join group");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (createdGroup?.invite_code) {
      navigator.clipboard.writeText(createdGroup.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirectInvite = async (groupIdArg) => {
    if (!selectedFriend) return;
    setLoading(true);
    try {
       const res = await api.post(`/groups/${groupIdArg}/invite-friend`, {
          friend_id: selectedFriend,
          user_id: session.user.id
       }, { headers: { Authorization: `Bearer ${session.access_token}` }});
       setInviteMessage({ type: 'success', text: res.data.message });
       setSelectedFriend('');
    } catch (err) {
       setInviteMessage({ type: 'error', text: err.response?.data?.detail || "Failed to invite." });
    } finally {
       setLoading(false);
       setTimeout(() => setInviteMessage(null), 3000);
    }
  };

  const copyAnyCode = (code) => {
     if (code) {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-100 w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
          <h2 className="text-xl font-bold text-stone-800 font-serif flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-indigo-600" />
            Family Groups
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdGroup ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-stone-800 mb-2">{createdGroup.name} Created!</h3>
            <p className="text-stone-500 mb-6">Share this invite code with your family members so they can join.</p>
            
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 w-full flex items-center justify-between shadow-inner mb-6">
              <span className="text-3xl font-mono tracking-widest font-bold text-indigo-700">
                {createdGroup.invite_code}
              </span>
              <button 
                onClick={() => copyAnyCode(createdGroup.invite_code)}
                className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                title="Copy Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {friends.length > 0 && (
              <div className="w-full text-left bg-white border border-indigo-100 p-4 rounded-xl shadow-sm">
                 <label className="block text-sm font-bold text-indigo-900 mb-2">Or Invite a Friend Directly</label>
                 <div className="flex gap-2">
                    <select 
                       value={selectedFriend}
                       onChange={(e) => setSelectedFriend(e.target.value)}
                       className="flex-1 p-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 outline-none focus:ring-2 focus:ring-indigo-500"
                       disabled={loading}
                    >
                       <option value="">Select a friend...</option>
                       {friends.map(f => (
                          <option key={f.id} value={f.id}>{f.username}#{f.tag}</option>
                       ))}
                    </select>
                    <button 
                       onClick={() => handleDirectInvite(createdGroup.id)}
                       disabled={!selectedFriend || loading}
                       className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                       Invite
                    </button>
                 </div>
                 {inviteMessage && (
                    <p className={`text-xs mt-2 font-bold ${inviteMessage.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                       {inviteMessage.text}
                    </p>
                 )}
              </div>
            )}
            
            <button  
              onClick={onClose}
              className="mt-8 px-6 py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-medium transition-colors w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex border-b border-stone-200 bg-stone-50/30">
              <button 
                onClick={() => { setActiveTab('join'); setError(null); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'join' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
              >
                Join
              </button>
              <button 
                onClick={() => { setActiveTab('create'); setError(null); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'create' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
              >
                Create
              </button>
              <button 
                onClick={() => { setActiveTab('manage'); setError(null); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'manage' ? 'text-stone-800 border-b-2 border-stone-800 bg-white' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
              >
                Manage
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                  {error}
                </div>
              )}

              {activeTab === 'join' ? (
                <form onSubmit={handleJoin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Invite Code</label>
                    <input 
                      type="text" 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="w-full text-center text-2xl tracking-widest font-mono p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-shadow uppercase uppercase bg-white placeholder:text-stone-300"
                      placeholder="XXXXXX"
                      disabled={loading}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || inviteCode.length < 6}
                    className="mt-2 w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex justify-center disabled:opacity-50 shadow-sm"
                  >
                    {loading ? 'Joining...' : 'Join Circle'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Circle Name</label>
                    <input 
                      type="text" 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full text-lg p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-shadow"
                      placeholder="e.g. The Smiths, Mom's Side"
                      disabled={loading}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !groupName.trim()}
                    className="mt-2 w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex justify-center disabled:opacity-50 shadow-sm"
                  >
                    {loading ? 'Creating...' : 'Create Circle'}
                  </button>
                </form>
              )}

              {activeTab === 'manage' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Select Circle</label>
                    <select 
                      value={selectedManageGroupId}
                      onChange={(e) => setSelectedManageGroupId(e.target.value)}
                      className="w-full text-lg p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none bg-stone-50"
                    >
                      <option value="">Choose a circle...</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedManageGroupId && (
                    <div className="mt-4 flex flex-col gap-6 animate-in fade-in duration-300">
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 w-full flex items-center justify-between shadow-inner">
                        <span className="text-2xl font-mono tracking-widest font-bold text-indigo-700">
                          {groups.find(g => g.id === selectedManageGroupId)?.invite_code || 'CODE'}
                        </span>
                        <button 
                          onClick={() => copyAnyCode(groups.find(g => g.id === selectedManageGroupId)?.invite_code)}
                          className="p-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                          title="Copy Code"
                        >
                          {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>

                      {friends.length > 0 ? (
                        <div className="w-full text-left bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
                          <label className="block text-sm font-bold text-stone-800 mb-2">Add Friend to Circle</label>
                          <div className="flex gap-2">
                              <select 
                                value={selectedFriend}
                                onChange={(e) => setSelectedFriend(e.target.value)}
                                className="flex-1 p-2.5 border border-stone-200 rounded-lg text-sm bg-stone-50 outline-none"
                                disabled={loading}
                              >
                                <option value="">Select a friend...</option>
                                {friends.map(f => (
                                    <option key={f.id} value={f.id}>{f.username}#{f.tag}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleDirectInvite(selectedManageGroupId)}
                                disabled={!selectedFriend || loading}
                                className="px-4 py-2.5 bg-stone-800 text-white font-bold rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-50"
                              >
                                Invite
                              </button>
                          </div>
                          {inviteMessage && (
                              <p className={`text-xs mt-2 font-bold ${inviteMessage.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {inviteMessage.text}
                              </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-stone-500 italic p-4 border border-dashed rounded-lg text-center">
                           Add friends in the Social Hub before inviting them!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
