
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  CheckCheck,
  ChevronLeft,
  CheckCircle2,
  RotateCcw,
  Clock,
  X,
  FileIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Conversation, Message } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  conversation: Conversation;
  onSendMessage: (text: string) => void;
  onToggleAI: () => void;
  onToggleStatus: (id: string, status: 'unread' | 'resolved' | 'active') => void;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversation, 
  onSendMessage, 
  onToggleAI, 
  onToggleStatus,
  onBack 
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() || selectedFile) {
      const messageText = selectedFile 
        ? `[Sent File: ${selectedFile.name}] ${inputText}`.trim()
        : inputText;
      
      onSendMessage(messageText);
      setInputText('');
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const isResolved = conversation.status === 'resolved';

  const getDurationText = () => {
    const end = isResolved && conversation.resolvedAt ? conversation.resolvedAt : new Date();
    const diffMs = end.getTime() - conversation.startedAt.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 24) return `${Math.floor(diffHrs/24)}d ${diffHrs%24}h`;
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
          {onBack && (
            <button 
              onClick={onBack}
              className="lg:hidden p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-500"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="relative">
            <img src={conversation.avatar} alt={conversation.customerName} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-indigo-50 flex-shrink-0" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors ${isResolved ? 'bg-slate-300' : 'bg-emerald-500'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-800 text-sm leading-tight truncate tracking-tight">{conversation.customerName}</h2>
              {isResolved && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                  Resolved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-hidden text-[9px] md:text-[10px] font-black uppercase tracking-tighter">
              <span className="text-slate-400">Via {conversation.channel}</span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-indigo-500">
                <Clock className="w-3 h-3" />
                <span>{isResolved ? 'Solved in' : 'Open for'} {getDurationText()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center bg-indigo-50/50 px-3 py-1.5 rounded-full mr-2 border border-indigo-100/50">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 animate-pulse" />
            <span className="text-[9px] font-black text-indigo-600 tracking-widest uppercase">AI Active</span>
          </div>
          
          <button 
            onClick={() => onToggleStatus(conversation.id, isResolved ? 'active' : 'resolved')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isResolved 
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700'
            }`}
          >
            {isResolved ? <RotateCcw className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            <span className="hidden sm:inline">{isResolved ? 'Reopen' : 'Resolve'}</span>
          </button>

          <button 
            onClick={onToggleAI}
            className="hidden lg:flex p-2 bg-indigo-50 rounded-lg text-indigo-600 transition-all shadow-sm ml-1"
            title="Toggle AI Suggestions"
          >
            <Sparkles className="w-5 h-5 fill-indigo-600/20" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/20">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center my-4">
            <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
              {conversation.startedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          {conversation.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isFile = msg.text.startsWith('[Sent File:');
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-1`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] group flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                  <div className={`px-4 py-3 rounded-[20px] text-sm relative shadow-sm border ${
                    isUser 
                      ? 'bg-white text-slate-800 rounded-tl-none border-slate-200 shadow-slate-100' 
                      : 'bg-indigo-600 text-white rounded-tr-none border-indigo-500 shadow-indigo-100'
                  }`}>
                    {isFile ? (
                      <div className="flex items-center gap-3 mb-1 p-2 bg-black/5 rounded-xl border border-black/5">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          {msg.text.includes('.png') || msg.text.includes('.jpg') ? <ImageIcon className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase opacity-60">Attachment</p>
                          <p className="text-xs font-bold truncate">{msg.text.split(']')[0].replace('[Sent File: ', '')}</p>
                        </div>
                      </div>
                    ) : null}
                    
                    <p className="leading-relaxed whitespace-pre-wrap font-medium">
                      {isFile ? msg.text.split(']').slice(1).join(']').trim() : msg.text}
                    </p>
                    
                    <div className={`flex items-center gap-1.5 mt-2 opacity-50 text-[9px] font-black tracking-widest ${isUser ? 'justify-start' : 'justify-end text-white'}`}>
                       {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       {!isUser && <CheckCheck className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-5 bg-white border-t border-slate-100 relative">
        <AnimatePresence>
          {selectedFile && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-3 px-4 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-[10px] text-indigo-400 font-bold">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => setSelectedFile(null)} className="p-1.5 hover:bg-white rounded-full text-indigo-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 md:gap-3 max-w-5xl mx-auto">
          {/* Hidden File Input */}
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          
          {/* Fix: changed standard button to motion.button to support Framer Motion props */}
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: '#eef2ff' }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onToggleAI}
            className="lg:hidden p-3.5 bg-indigo-50 rounded-[20px] text-indigo-600 transition-all shadow-sm border border-indigo-100/50 flex-shrink-0"
            title="Ask AI for Suggestion"
          >
            <Sparkles className="w-5 h-5 fill-indigo-600/20" />
          </motion.button>

          <div className="flex-1 min-h-[48px] bg-slate-50 rounded-[24px] border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100/50 transition-all flex items-center px-3 py-1.5">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 transition-colors ${selectedFile ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              rows={1}
              placeholder="Type your reply..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 resize-none overflow-hidden max-h-32 font-medium"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() && !selectedFile}
            className="p-3.5 bg-indigo-600 text-white rounded-[20px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
