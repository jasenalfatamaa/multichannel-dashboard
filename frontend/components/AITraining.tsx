
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Database, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AITraining: React.FC = () => {
  const [files, setFiles] = useState([
    { name: 'product-catalog-2024.pdf', size: '2.4 MB', status: 'ready', date: '2 days ago' },
    { name: 'pricing-tiers.txt', size: '12 KB', status: 'ready', date: '5 days ago' },
  ]);

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setFiles([{ name: 'new-knowledge.pdf', size: '1.5 MB', status: 'ready', date: 'Just now' }, ...files]);
      setIsUploading(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100"
        >
          <Database className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Knowledge Base</h1>
        <p className="text-slate-500 mt-3 text-lg max-w-xl mx-auto font-medium">
          Upload PDF or Text files to train your AI Assistant on specific product knowledge and business policies.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Data', value: '2.6 MB', icon: CheckCircle, color: 'text-slate-800' },
          { label: 'Index Status', value: 'Healthy', icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Intelligence', value: 'Turbo', icon: Zap, color: 'text-white', active: true }
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`p-6 rounded-[28px] border border-slate-200 shadow-sm text-center ${stat.active ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' : 'bg-white'}`}
          >
             <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${stat.active ? 'text-indigo-200' : 'text-slate-400'}`}>{stat.label}</p>
             <p className={`text-2xl font-black flex items-center justify-center gap-2 ${stat.color}`}>
               {stat.active && <Zap className="w-5 h-5 fill-white" />}
               {stat.value}
             </p>
          </motion.div>
        ))}
      </div>

      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 p-12 mb-10 text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-all group cursor-pointer relative overflow-hidden"
      >
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          onChange={handleUpload}
          disabled={isUploading}
        />
        
        {/* Animated Background Decor */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2, opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-indigo-600 rounded-full blur-[100px]"
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center relative z-20">
          <motion.div 
            animate={isUploading ? { y: [0, -10, 0] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-white shadow-sm transition-colors"
          >
            <Upload className={`w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors ${isUploading ? 'animate-pulse text-indigo-600' : ''}`} />
          </motion.div>
          <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight">Click or drag to train AI</h3>
          <p className="text-slate-400 text-sm font-medium">Supported formats: PDF, TXT, DOCX (Max 20MB)</p>
          
          <AnimatePresence>
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-indigo-600 font-black text-xs uppercase tracking-[0.2em] animate-pulse"
              >
                Processing Knowledge Graph...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-800 tracking-tight uppercase text-sm tracking-widest">Active Sources</h2>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{files.length} indexed files</span>
        </div>
        <div className="divide-y divide-slate-100">
          <AnimatePresence initial={false}>
            {files.map((file, idx) => (
              <motion.div 
                key={file.name} 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white shadow-sm transition-colors">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 tracking-tight">{file.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{file.size}</span>
                      <span className="text-[9px] text-slate-300">•</span>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Added {file.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded tracking-[0.2em] border border-emerald-100">
                    Ready
                  </span>
                  <button className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-all active:scale-90">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4"
      >
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-700 leading-relaxed uppercase tracking-wider font-bold">
          <p className="mb-1 text-xs">Propagating Changes:</p>
          Vector indexing updates take ~120s to propagate. Ensure data accuracy to maintain AI response quality.
        </div>
      </motion.div>
    </div>
  );
};

export default AITraining;
