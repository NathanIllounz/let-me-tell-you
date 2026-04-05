import { useState } from 'react';
import { X, Users, Copy, Check, UsersRound } from 'lucide-react';
import api from '../api';

export default function FamilyGroups({ session, onClose, onGroupAdded }) {
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  
  // Create 
  const [groupName, setGroupName] = useState('');
  const [createdGroup, setCreatedGroup] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Join
  const [inviteCode, setInviteCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
            
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 w-full flex items-center justify-between shadow-inner">
              <span className="text-3xl font-mono tracking-widest font-bold text-indigo-700">
                {createdGroup.invite_code}
              </span>
              <button 
                onClick={copyCode}
                className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                title="Copy Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            
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
                Join a Circle
              </button>
              <button 
                onClick={() => { setActiveTab('create'); setError(null); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'create' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
              >
                Create a Circle
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
