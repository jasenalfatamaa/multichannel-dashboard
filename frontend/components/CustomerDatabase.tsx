
import React, { useState } from 'react';
import { Customer } from '../types';
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Download,
  Users,
  X,
  UserPlus,
  MessageSquare,
  Sparkles,
  User,
  Trash2,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerDatabaseProps {
  customers: Customer[];
  onAddCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
  onStartChat?: (customerName: string) => void;
}

const tableVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const CustomerDatabase: React.FC<CustomerDatabaseProps> = ({
  customers,
  onAddCustomer,
  onDeleteCustomer,
  onStartChat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tag: 'New'
  });

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTagColor = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('vip')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (t.includes('potential')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (t.includes('follow-up')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (t.includes('tech') || t.includes('support')) return 'bg-sky-100 text-sky-700 border-sky-200';
    if (t.includes('positive') || t.includes('high')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (t.includes('frustrated') || t.includes('priority')) return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const nameSlug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const newCustomer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      external_id: `manual-${nameSlug}-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '+6281200000000',
      tags: [formData.tag],
      lastActive: new Date(),
      avatar: `https://i.pravatar.cc/150?u=${formData.name.replace(' ', '')}`,
      source: 'manual'
    };

    onAddCustomer?.(newCustomer);
    setIsModalOpen(false);
    setFormData({ name: '', email: '', phone: '', tag: 'New' });
  };

  const confirmDelete = () => {
    if (deletingCustomer) {
      onDeleteCustomer?.(deletingCustomer.id);
      if (viewingCustomer?.id === deletingCustomer.id) setViewingCustomer(null);
      setDeletingCustomer(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto relative px-2 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Customers</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">Unified database and smart AI tagging system.</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-[10px] sm:text-xs font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          <motion.button
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 sm:py-2 bg-indigo-600 text-white rounded-xl text-[10px] sm:text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            New
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* MOBILE & TABLET LIST VIEW (Hidden on md and up) */}
        <div className="block md:hidden">
          <motion.div
            variants={tableVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-slate-50"
          >
            {filtered.map((customer) => (
              <motion.div
                key={customer.id}
                variants={rowVariants}
                whileTap={{ backgroundColor: '#f1f5f9' }}
                onClick={() => setViewingCustomer(customer)}
                className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={customer.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-slate-100" />
                    {customer.source === 'chat' && (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm ring-1 ring-indigo-50">
                        <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm tracking-tight">{customer.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${getTagColor(customer.tags[0])}`}>
                        {customer.tags[0]}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">• {customer.source === 'chat' ? 'AI Sync' : 'Manual'}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* DESKTOP TABLE VIEW (Hidden on mobile/tablet) */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tags</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Activity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
              </tr>
            </thead>
            <motion.tbody
              variants={tableVariants}
              initial="hidden"
              animate="visible"
              className="divide-y divide-slate-100"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    variants={rowVariants}
                    layout
                    whileHover={{ backgroundColor: '#f8fafc' }}
                    className="transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <img src={customer.avatar} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-slate-100" />
                        <span className="font-bold text-slate-800 text-sm tracking-tight">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {customer.source === 'chat' ? (
                        <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg w-fit">
                          <MessageSquare className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Chat Sync</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded-lg w-fit">
                          <UserPlus className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Manual</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-300" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-300" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {customer.tags.map(tag => {
                          const isAiTag = customer.source === 'chat';
                          return (
                            <span
                              key={tag}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border tracking-widest ${getTagColor(tag)}`}
                            >
                              {isAiTag && <Sparkles className="w-2.5 h-2.5" />}
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        {customer.lastActive.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="relative">
                        <button
                          aria-label="Open menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === customer.id ? null : customer.id);
                          }}
                          className={`p-2 rounded-lg transition-all ${activeMenuId === customer.id ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'hover:bg-indigo-50 text-slate-300 hover:text-indigo-600'
                            }`}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {activeMenuId === customer.id && (
                            <>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveMenuId(null)}
                                className="fixed inset-0 z-[60]"
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[70] overflow-hidden py-2"
                              >
                                <button
                                  onClick={() => {
                                    setViewingCustomer(customer);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-slate-600 transition-colors"
                                >
                                  <User className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-bold">View Profile</span>
                                </button>
                                <button
                                  onClick={() => {
                                    onStartChat?.(customer.name);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-slate-600 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-bold">Start Chat</span>
                                </button>
                                <div className="h-px bg-slate-50 my-1 mx-2" />
                                <button
                                  onClick={() => {
                                    setDeletingCustomer(customer);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-rose-50 text-rose-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="text-xs font-bold">Delete Contact</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-10 sm:py-20 text-center"
          >
            <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-10 text-slate-400" />
            <p className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] text-slate-400">No customers found</p>
          </motion.div>
        )}
      </motion.div>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] sm:rounded-[32px] w-full max-w-md p-6 sm:p-8 relative z-10 shadow-2xl border border-white"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Add New Contact</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manual Entry</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4 sm:space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Andi Wijaya"
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="andi@company.com"
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62812..."
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Tag</label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium appearance-none"
                  >
                    <option>New</option>
                    <option>Potential</option>
                    <option>VIP</option>
                    <option>Follow-up</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4"
                >
                  Create Prospect
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Profile View Modal */}
      <AnimatePresence>
        {viewingCustomer && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCustomer(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              className="bg-white rounded-t-[32px] sm:rounded-[48px] w-full max-w-xl h-[85vh] sm:h-auto overflow-y-auto overflow-x-hidden relative z-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border border-white custom-scrollbar"
            >
              {/* Profile Header Background */}
              <div className="h-32 bg-indigo-600 relative overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-400/30 rounded-full blur-3xl"
                />
              </div>

              <div className="px-6 sm:px-8 pb-10 -mt-16 relative">
                <div className="flex items-end justify-between mb-8">
                  <div className="relative">
                    <img
                      src={viewingCustomer.avatar}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-[32px] sm:rounded-[40px] object-cover border-4 border-white shadow-2xl ring-1 ring-slate-100"
                      alt=""
                    />
                    <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white shadow-sm ${viewingCustomer.source === 'chat' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onStartChat?.(viewingCustomer.name);
                        setViewingCustomer(null);
                      }}
                      className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDeletingCustomer(viewingCustomer)}
                      className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{viewingCustomer.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {viewingCustomer.tags.map(tag => (
                      <span key={tag} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase border tracking-widest ${getTagColor(tag)}`}>
                        {viewingCustomer.source === 'chat' && <Sparkles className="w-3 h-3" />}
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" /> Email Address
                      </p>
                      <p className="text-sm font-bold text-slate-700 break-all">{viewingCustomer.email}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3" /> Phone Number
                      </p>
                      <p className="text-sm font-bold text-slate-700">{viewingCustomer.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Last Active
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {viewingCustomer.lastActive.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" /> Verification Source
                      </p>
                      <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest ${viewingCustomer.source === 'chat' ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {viewingCustomer.source === 'chat' ? 'OmniAI Verified Chat' : 'Manual Entry'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-6 bg-slate-50 rounded-[24px] sm:rounded-[32px] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Recent Interaction
                  </h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    "System automatically analyzed customer intent as {viewingCustomer.tags[0]}.
                    Customer reached via {viewingCustomer.source === 'chat' ? 'Instant Messenger' : 'CRM Dashboard'}."
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingCustomer(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCustomer && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingCustomer(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm p-8 relative z-10 shadow-2xl border border-white overflow-hidden text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>

              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Delete Contact?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                Are you sure you want to remove <span className="text-slate-800 font-bold">{deletingCustomer.name}</span>? This action is permanent and cannot be undone.
              </p>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDelete}
                  className="w-full py-4 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all"
                >
                  Delete Permanently
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeletingCustomer(null)}
                  className="w-full py-4 bg-slate-50 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDatabase;
