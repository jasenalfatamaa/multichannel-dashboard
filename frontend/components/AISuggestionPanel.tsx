
import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Copy, Check, MousePointer2, Wand2, X, ChevronDown } from 'lucide-react';
import { Conversation } from '../types';
import { getAISuggestion } from '../services/geminiService';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface AISuggestionPanelProps {
  conversation: Conversation;
  onApplySuggestion: (text: string) => void;
  onClose?: () => void;
}

const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({ conversation, onApplySuggestion, onClose }) => {
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSuggestion = async () => {
    setIsLoading(true);
    const result = await getAISuggestion(conversation.messages, conversation.customerName);
    setSuggestion(result);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSuggestion();
  }, [conversation.messages.length]);

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Varian animasi responsif: Slide up di mobile, Slide right di desktop
  const variants: Variants = {
    initial: { 
      y: typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : 0,
      x: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 320 : 0,
      opacity: 0 
    },
    animate: { 
      y: 0, 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring' as const, damping: 25, stiffness: 200 }
    },
    exit: { 
      y: typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : 0,
      x: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 320 : 0,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-x-0 bottom-0 h-[65vh] lg:h-full lg:relative lg:w-80 lg:inset-auto bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.15)] lg:shadow-none overflow-hidden z-50 rounded-t-[32px] lg:rounded-t-none"
    >
      {/* Mobile Handle Bar - Only visible on mobile/tablet */}
      <div className="lg:hidden flex justify-center py-3">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
      </div>

      <div className="px-5 md:px-6 py-4 md:py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Smart AI</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={fetchSuggestion}
            disabled={isLoading}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
            >
              <X className="w-5 h-5 lg:hidden" />
              <ChevronDown className="w-5 h-5 hidden lg:block" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-5 md:p-6 overflow-y-auto custom-scrollbar">
        <div className="bg-slate-50/80 rounded-2xl p-4 md:p-5 border border-slate-200/50 relative group min-h-[180px] flex flex-col shadow-sm">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
               <Wand2 className="w-8 h-8 animate-pulse text-indigo-200" />
               <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analyzing context...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">DRAFT REPLY</span>
                <button onClick={handleCopy} className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm transition-all active:scale-90">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic font-medium">
                "{suggestion}"
              </p>
              
              <div className="mt-auto pt-6 flex flex-col gap-2">
                <button 
                  onClick={() => onApplySuggestion(suggestion)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <MousePointer2 className="w-3.5 h-3.5" />
                  Apply & Send
                </button>
                <button 
                  onClick={() => {}} 
                  className="w-full py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Edit manually
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-8">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Customer Context</h4>
           <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div>
                   <p className="text-[11px] font-bold text-slate-700">Sentiment: Positive</p>
                   <p className="text-[10px] text-slate-400 font-medium">High conversion potential</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <div>
                   <p className="text-[11px] font-bold text-slate-700">Urgency: Medium</p>
                   <p className="text-[10px] text-slate-400 font-medium">Expect reply in 1h</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto hidden lg:block">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Knowledge Base 2.0</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
          AI is verified with your PDF product catalog and pricing tiers for accuracy.
        </p>
      </div>
    </motion.div>
  );
};

export default AISuggestionPanel;
