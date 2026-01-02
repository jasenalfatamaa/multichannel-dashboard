
import React, { useState } from 'react';
import { Search, Filter, CheckCircle2, Calendar, Check } from 'lucide-react';
import { Conversation, Channel } from '../types';
import { CHANNEL_ICONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInboxProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
}

const ChatInbox: React.FC<ChatInboxProps> = ({ conversations, selectedId, onSelect }) => {
  const [statusFilter, setStatusFilter] = useState<'active' | 'unread' | 'resolved'>('active');
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    const matchesStatus = conv.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || conv.channel === channelFilter;
    const matchesSearch = conv.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          conv.lastMessage.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesChannel && matchesSearch;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden border-r border-slate-100">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Messages</h1>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-lg transition-colors ${isFilterOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-500'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            
            {/* Filter Dropdown */}
            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setIsFilterOpen(false)}
                    className="fixed inset-0 z-10"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden py-2"
                  >
                    <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                      Filter by Channel
                    </div>
                    {(['all', 'whatsapp', 'instagram', 'telegram'] as const).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => {
                          setChannelFilter(ch);
                          setIsFilterOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-600 capitalize">{ch}</span>
                        {channelFilter === ch && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mb-2">
          {['active', 'unread', 'resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                statusFilter === tab 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <motion.button
                key={conv.id}
                layout
                onClick={() => onSelect(conv)}
                className={`w-full flex items-start gap-3 p-4 border-b border-slate-50 transition-colors relative ${
                  selectedId === conv.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'
                }`}
              >
                {selectedId === conv.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" 
                  />
                )}
                
                <div className="relative flex-shrink-0">
                  <img src={conv.avatar} alt={conv.customerName} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100" />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm ring-1 ring-slate-50">
                    {CHANNEL_ICONS[conv.channel]}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-slate-800 text-sm truncate tracking-tight">{conv.customerName}</h3>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {conv.lastTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 truncate leading-relaxed font-medium mb-2">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center gap-2 mt-auto">
                    {conv.tags.slice(0, 1).map(tag => (
                      <span key={tag} className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.15em] border ${
                        tag === 'VIP' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {tag}
                      </span>
                    ))}
                    {conv.unreadCount > 0 && (
                      <span className="ml-auto w-5 h-5 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-md shadow-indigo-100">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="p-10 text-center">
              <div className="mb-4 flex justify-center opacity-20">
                <Search className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No conversations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInbox;
