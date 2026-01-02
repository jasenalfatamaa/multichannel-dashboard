
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  BrainCircuit, 
  Share2, 
  Shield, 
  CreditCard, 
  Bell, 
  Camera, 
  Save, 
  CheckCircle2, 
  Zap, 
  MessageCircle, 
  Instagram, 
  Send as TelegramIcon, 
  Globe,
  Sparkles,
  ChevronRight,
  Loader2,
  X,
  Check,
  RefreshCcw,
  MoreVertical,
  Plus,
  Music,
  MessageSquare,
  Trash2,
  Edit2,
  Key,
  Smartphone,
  History,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  Users,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';

type SettingsTab = 'profile' | 'ai' | 'channels' | 'security' | 'team' | 'billing';

interface IntegrationChannel {
  id: string;
  name: string;
  type: 'whatsapp' | 'instagram' | 'telegram' | 'tiktok' | 'line' | 'ecommerce';
  account: string;
  status: 'Connected' | 'Inactive';
}

interface UserSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  status: 'Current' | 'Active';
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Invited';
  password?: string; // Menyimpan password untuk login dummy
  avatar?: string;
}

const STORAGE_KEY = 'omniai_user_profile';
const CHANNELS_KEY = 'omniai_active_channels';
const TEAM_KEY = 'omniai_team_members';

const Settings: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<IntegrationChannel | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Team management state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [showNewMemberPass, setShowNewMemberPass] = useState(false);
  const [resettingMember, setResettingMember] = useState<TeamMember | null>(null);
  const [showResetPass, setShowResetPass] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState('');
  
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'admin' as UserRole, password: '' });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(TEAM_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'tm-1', name: 'Ahmad Kurniawan', email: 'super@omniai.com', role: 'super_admin', status: 'Active', password: 'password123', avatar: 'https://i.pravatar.cc/150?u=super' },
      { id: 'tm-2', name: 'Budi Santoso', email: 'admin@omniai.com', role: 'admin', status: 'Active', password: 'password123', avatar: 'https://i.pravatar.cc/150?u=admin' },
    ];
  });

  // --- SECURITY STATES ---
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [sessions, setSessions] = useState<UserSession[]>([
    { id: 'sess-1', device: 'Windows 11', browser: 'Chrome', location: 'Jakarta, ID', status: 'Current' },
    { id: 'sess-2', device: 'iPhone 15 Pro', browser: 'Safari', location: 'Singapore', status: 'Active' },
    { id: 'sess-3', device: 'Macbook Air', browser: 'Arc', location: 'Bandung, ID', status: 'Active' },
  ]);

  // Profile State
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { aiAutoReply: true, aiTone: 'Friendly', ...parsed };
      } catch (e) { console.error(e); }
    }
    return {
      name: 'Ahmad Kurniawan',
      email: 'admin@omniai.com',
      org: 'OmniAI Tech Solutions',
      timezone: 'Jakarta (GMT+7)',
      avatar: 'https://i.pravatar.cc/150?u=admin',
      aiAutoReply: true,
      aiTone: 'Friendly'
    };
  });

  // Channels State
  const [channels, setChannels] = useState<IntegrationChannel[]>(() => {
    const saved = localStorage.getItem(CHANNELS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'ch-1', name: 'WhatsApp', type: 'whatsapp', account: '+62 812 9000 XXXX', status: 'Connected' },
      { id: 'ch-2', name: 'Instagram', type: 'instagram', account: '@omni.official', status: 'Connected' },
      { id: 'ch-3', name: 'Telegram', type: 'telegram', account: 'None', status: 'Inactive' },
      { id: 'ch-4', name: 'E-commerce API', type: 'ecommerce', account: 'Shopify v2.1', status: 'Connected' },
    ];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setShowToast({ show: true, msg });
    setTimeout(() => setShowToast({ show: false, msg: '' }), 3000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
      localStorage.setItem(TEAM_KEY, JSON.stringify(teamMembers));
      setIsSaving(false);
      triggerToast("Settings saved successfully");
    }, 1200);
  };

  const handleSyncKnowledge = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      triggerToast("AI Knowledge Base Synchronized");
    }, 2500);
  };

  const toggleAutoReply = () => {
    setProfile(prev => {
      const updated = { ...prev, aiAutoReply: !prev.aiAutoReply };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // --- INTEGRATION HANDLERS ---
  const handleAddChannel = (type: IntegrationChannel['type']) => {
    const names: Record<string, string> = { tiktok: 'TikTok', line: 'LINE' };
    const newChannel: IntegrationChannel = {
      id: `ch-${Math.random().toString(36).substr(2, 9)}`,
      name: names[type] || 'New Channel',
      type: type,
      account: type === 'line' ? '@line_official' : '@tiktok_biz',
      status: 'Connected'
    };
    
    const updated = [...channels, newChannel];
    setChannels(updated);
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(updated));
    setIsAddModalOpen(false);
    triggerToast(`${newChannel.name} Integrated Successfully`);
  };

  const handleUpdateChannel = (updated: IntegrationChannel) => {
    const newChannels = channels.map(c => c.id === updated.id ? updated : c);
    setChannels(newChannels);
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(newChannels));
    setEditingChannel(null);
    triggerToast("Integration Detail Updated");
  };

  const handleDeleteChannel = (id: string) => {
    const newChannels = channels.filter(c => c.id !== id);
    setChannels(newChannels);
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(newChannels));
    setActiveMenuId(null);
    triggerToast("Channel Disconnected");
  };

  // --- TEAM MANAGEMENT HANDLERS ---
  const handleAddTeamMember = () => {
    if (!newMember.name || !newMember.email || !newMember.password) return triggerToast("Please fill all fields");
    const member: TeamMember = {
      id: `tm-${Math.random().toString(36).substr(2, 9)}`,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      status: 'Active', // Set to Active for direct login
      password: newMember.password,
      avatar: `https://i.pravatar.cc/150?u=${newMember.name.replace(' ', '')}`
    };
    const updated = [...teamMembers, member];
    setTeamMembers(updated);
    localStorage.setItem(TEAM_KEY, JSON.stringify(updated));
    setIsTeamModalOpen(false);
    setNewMember({ name: '', email: '', role: 'admin', password: '' });
    triggerToast(`${member.name} has been added to the team`);
  };

  const handleResetPassword = () => {
    if (!resettingMember || !newResetPassword) return triggerToast("Password cannot be empty");
    
    const updated = teamMembers.map(m => {
      if (m.id === resettingMember.id) {
        return { ...m, password: newResetPassword };
      }
      return m;
    });
    
    setTeamMembers(updated);
    localStorage.setItem(TEAM_KEY, JSON.stringify(updated));
    setResettingMember(null);
    setNewResetPassword('');
    triggerToast(`Password for ${resettingMember.name} has been reset`);
  };

  const handleRemoveMember = (id: string) => {
    const updated = teamMembers.filter(m => m.id !== id);
    setTeamMembers(updated);
    localStorage.setItem(TEAM_KEY, JSON.stringify(updated));
    triggerToast("Member removed from team");
  };

  // --- SECURITY HANDLERS ---
  const handlePasswordChange = () => {
    if (!passData.current || !passData.new || !passData.confirm) {
      return triggerToast("Please fill all password fields");
    }
    if (passData.new.length < 8) {
      return triggerToast("New password must be at least 8 characters");
    }
    if (passData.new !== passData.confirm) {
      return triggerToast("New passwords do not match");
    }
    
    // Simulating API call
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast("Password successfully updated");
      setPassData({ current: '', new: '', confirm: '' });
    }, 1000);
  };

  const handleLogoutAllSessions = () => {
    const currentSession = sessions.filter(s => s.status === 'Current');
    setSessions(currentSession);
    triggerToast("Logged out from all other devices");
  };

  const getChannelIcon = (type: IntegrationChannel['type']) => {
    switch (type) {
      case 'whatsapp': return { icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'instagram': return { icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-50' };
      case 'telegram': return { icon: TelegramIcon, color: 'text-sky-500', bg: 'bg-sky-50' };
      case 'tiktok': return { icon: Music, color: 'text-slate-900', bg: 'bg-slate-100' };
      case 'line': return { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'ecommerce': return { icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50' };
      default: return { icon: Share2, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  const navItems = [
    { id: 'profile', icon: User, label: 'Account Profile' },
    { id: 'ai', icon: BrainCircuit, label: 'AI Configuration' },
    { id: 'channels', icon: Share2, label: 'Integrations' },
    { id: 'security', icon: Shield, label: 'Security & Access' },
    ...(userRole === 'super_admin' ? [{ id: 'team', icon: Users, label: 'Team Access' }] : []),
    { id: 'billing', icon: CreditCard, label: 'Billing & Plan' },
  ];

  return (
    <div className="max-w-6xl mx-auto relative">
      <AnimatePresence>
        {showToast.show && (
          <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[300] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md"
          >
            <div className="bg-indigo-500 p-1.5 rounded-full flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{showToast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 md:mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1 font-medium">Customize your workspace, AI behavior, and account preferences.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id as SettingsTab)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all whitespace-nowrap lg:w-full ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100'}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                  {isActive && <motion.div layoutId="tab-pill" className="ml-auto hidden lg:block"><ChevronRight className="w-4 h-4" /></motion.div>}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm p-6 md:p-10 min-h-[600px] relative overflow-hidden flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                      <motion.div whileHover={{ scale: 1.02 }} className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <img src={profile.avatar} className="w-32 h-32 rounded-[40px] object-cover ring-4 ring-slate-50 shadow-xl transition-all group-hover:brightness-90" alt="avatar" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Camera className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                      </motion.div>
                      <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform active:scale-95 z-10"><Camera className="w-5 h-5" /></button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setProfile(prev => ({ ...prev, avatar: reader.result as string }));
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{profile.name}</h3>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{userRole === 'super_admin' ? 'Super Admin' : 'Admin'} • Full System Access</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="p-8 bg-indigo-600 rounded-[32px] text-white relative overflow-hidden shadow-2xl shadow-indigo-100/20">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-2"><Sparkles className="w-6 h-6 text-indigo-300" /> OmniAI Brain Core</h3>
                        <p className="text-indigo-200 text-sm mt-1">AI level: Turbo Gemini 3.0 • Knowledge: Active</p>
                      </div>
                      <button onClick={handleSyncKnowledge} disabled={isSyncing} className="px-6 py-3 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-105 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                        {isSyncing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        {isSyncing ? 'Syncing...' : 'Sync Knowledge'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm"><Zap className={`w-5 h-5 ${profile.aiAutoReply ? 'text-indigo-600' : 'text-slate-300'}`} /></div>
                        <div><h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Auto-Reply Mode</h4><p className="text-xs text-slate-400 font-medium">AI will respond automatically to incoming customer messages</p></div>
                      </div>
                      <button onClick={toggleAutoReply} className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${profile.aiAutoReply ? 'bg-indigo-600' : 'bg-slate-300'}`}><motion.div animate={{ x: profile.aiAutoReply ? 24 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-md" /></button>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Tone & Personality</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Professional', 'Friendly', 'Concise', 'Persuasive'].map((tone) => (
                          <button key={tone} onClick={() => setProfile({ ...profile, aiTone: tone })} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${profile.aiTone === tone ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'channels' && (
                <motion.div key="channels" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Integrations</h3>
                      <p className="text-slate-500 text-xs font-medium mt-1">Manage connected messaging channels.</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
                      <Plus className="w-4 h-4" /> Connect New
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {channels.map((ch) => {
                      const { icon: Icon, color, bg } = getChannelIcon(ch.type);
                      return (
                        <div key={ch.id} className="flex items-center justify-between p-4 md:p-6 bg-white rounded-[28px] border border-slate-100 hover:shadow-md transition-shadow group relative">
                          <div className="flex items-center gap-3 md:gap-5 min-w-0">
                            <div className={`w-10 h-10 md:w-14 md:h-14 flex-shrink-0 ${bg} ${color} rounded-2xl flex items-center justify-center`}>
                              <Icon className="w-5 h-5 md:w-7 md:h-7" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-slate-800 tracking-tight truncate">{ch.name} Business</h4>
                              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{ch.account}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                            <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${ch.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                              {ch.status}
                            </span>
                            <div className="relative">
                              <button onClick={() => setActiveMenuId(activeMenuId === ch.id ? null : ch.id)} className={`p-2 md:p-2.5 rounded-xl transition-colors ${activeMenuId === ch.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300 hover:text-indigo-600'}`}>
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              <AnimatePresence>
                                {activeMenuId === ch.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden py-2"
                                    >
                                      <button onClick={() => { setEditingChannel(ch); setActiveMenuId(null); }} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors">
                                        <Edit2 className="w-4 h-4 text-slate-400" /> Edit Detail
                                      </button>
                                      <div className="h-px bg-slate-50 my-1 mx-2" />
                                      <button onClick={() => handleDeleteChannel(ch.id)} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors">
                                        <Trash2 className="w-4 h-4" /> Disconnect
                                      </button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  {/* Security Header Card */}
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Security Status</h3>
                        <p className="text-xs text-emerald-600 font-bold">Your account is well protected.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Password Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Update Password</h4>
                      </div>
                      
                      <div className="space-y-4 p-6 bg-white border border-slate-100 rounded-[28px]">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                          <div className="relative">
                            <input 
                              type={showCurrentPass ? "text" : "password"}
                              value={passData.current}
                              onChange={e => setPassData({...passData, current: e.target.value})}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium pr-12" 
                              placeholder="••••••••"
                            />
                            <button onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                          <div className="relative">
                            <input 
                              type={showNewPass ? "text" : "password"}
                              value={passData.new}
                              onChange={e => setPassData({...passData, new: e.target.value})}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium pr-12" 
                              placeholder="Min. 8 characters"
                            />
                            <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                          <div className="relative">
                            <input 
                              type={showConfirmPass ? "text" : "password"}
                              value={passData.confirm}
                              onChange={e => setPassData({...passData, confirm: e.target.value})}
                              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium pr-12" 
                              placeholder="••••••••"
                            />
                            <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <button 
                          onClick={handlePasswordChange}
                          disabled={isSaving}
                          className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-3 h-3" />}
                          Update Password
                        </button>
                      </div>
                    </div>

                    {/* 2FA & Activity Section */}
                    <div className="space-y-8">
                      {/* 2FA Card */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Two-Factor Auth</h4>
                        </div>
                        <div className="p-6 border border-slate-100 rounded-[28px] flex items-center justify-between group hover:border-indigo-100 transition-colors bg-white">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${is2FAEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Authenticator App</p>
                               <p className="text-[10px] text-slate-400 font-medium">Extra layer of protection</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setIs2FAEnabled(!is2FAEnabled);
                              triggerToast(is2FAEnabled ? "2FA Disabled" : "2FA Enabled Successfully");
                            }}
                            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${is2FAEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                          >
                            <motion.div animate={{ x: is2FAEnabled ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                          </button>
                        </div>
                      </div>

                      {/* Session History Card */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Sessions</h4>
                          </div>
                          <button onClick={handleLogoutAllSessions} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Log out others</button>
                        </div>
                        <div className="divide-y divide-slate-50 border border-slate-100 rounded-[28px] overflow-hidden bg-white">
                          <AnimatePresence initial={false}>
                            {sessions.map((session) => (
                              <motion.div 
                                key={session.id} 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                              >
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                      {session.device.includes('iPhone') ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-800 tracking-tight">{session.device} • {session.browser}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{session.location}</p>
                                    </div>
                                 </div>
                                 <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${session.status === 'Current' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                   {session.status}
                                 </span>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'team' && userRole === 'super_admin' && (
                <motion.div key="team" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Team Management</h3>
                      <p className="text-slate-500 text-xs font-medium mt-1">Manage team members and their permission levels.</p>
                    </div>
                    <button onClick={() => setIsTeamModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
                      <Plus className="w-4 h-4" /> Add Member
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-6 bg-white rounded-[28px] border border-slate-100 hover:shadow-md transition-shadow group">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                               <User className="w-6 h-6" />
                            </div>
                            <div>
                               <h4 className="text-sm font-black text-slate-800">{member.name}</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.email}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${member.role === 'super_admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                               {member.role.replace('_', ' ')}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                               {member.status}
                            </span>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setResettingMember(member);
                                  setShowResetPass(false);
                                  setNewResetPassword('');
                                }} 
                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Reset Password"
                              >
                                <RefreshCw className="w-5 h-5" />
                              </button>
                              
                              {member.email !== 'super@omniai.com' && (
                                <button onClick={() => handleRemoveMember(member.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Remove Member">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-2 px-2 pb-2 z-20">
            <button onClick={() => { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setProfile(JSON.parse(saved)); }} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Discard Changes</button>
            <motion.button onClick={handleSave} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 relative overflow-hidden min-w-[180px] justify-center" disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save All Settings</>}
            </motion.button>
          </div>
        </main>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-white"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Connect Channel</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'tiktok', name: 'TikTok', icon: Music },
                  { type: 'line', name: 'LINE', icon: MessageSquare },
                ].map(opt => (
                  <button key={opt.type} onClick={() => handleAddChannel(opt.type as any)} className="p-5 border border-slate-100 rounded-[24px] hover:border-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center gap-3 group">
                    <opt.icon className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-600">{opt.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {editingChannel && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-white"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Edit Integration</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{editingChannel.name} Business</p>
                </div>
                <button onClick={() => setEditingChannel(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel Name</label>
                  <input type="text" value={editingChannel.name} onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account / Identifier</label>
                  <input type="text" value={editingChannel.account} onChange={(e) => setEditingChannel({ ...editingChannel, account: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select value={editingChannel.status} onChange={(e) => setEditingChannel({ ...editingChannel, status: e.target.value as any })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none">
                    <option value="Connected">Connected</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setEditingChannel(null)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest">Cancel</button>
                  <button onClick={() => handleUpdateChannel(editingChannel)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Save Changes</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isTeamModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-white"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Add Team Member</h3>
                <button onClick={() => setIsTeamModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Name</label>
                  <input type="text" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium" placeholder="Full name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium" placeholder="email@omniai.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                  <div className="relative">
                    <input 
                      type={showNewMemberPass ? "text" : "password"} 
                      value={newMember.password} 
                      onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium pr-12" 
                      placeholder="••••••••" 
                    />
                    <button onClick={() => setShowNewMemberPass(!showNewMemberPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                      {showNewMemberPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                  <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value as UserRole })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none">
                    <option value="admin">Admin (Restricted)</option>
                    <option value="super_admin">Super Admin (Full Access)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsTeamModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest">Cancel</button>
                  <button onClick={handleAddTeamMember} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Invite Member</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {resettingMember && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-white"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Reset Password</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">For {resettingMember.name}</p>
                </div>
                <button onClick={() => setResettingMember(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showResetPass ? "text" : "password"} 
                      value={newResetPassword} 
                      onChange={(e) => setNewResetPassword(e.target.value)} 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium pr-12" 
                      placeholder="Min. 8 characters" 
                    />
                    <button onClick={() => setShowResetPass(!showResetPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                      {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setResettingMember(null)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest">Cancel</button>
                  <button onClick={handleResetPassword} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Reset Password</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
