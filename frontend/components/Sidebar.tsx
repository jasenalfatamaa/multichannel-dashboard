
import React from 'react';
import { LogOut } from 'lucide-react';
import { View, UserSession } from '../types';
import { NAV_ITEMS } from '../constants';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  userSession: UserSession | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, userSession, onLogout }) => {
  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <motion.aside
        initial={{ x: -80 }}
        animate={{ x: 0 }}
        className="hidden md:flex w-20 h-screen bg-white border-r border-slate-200 flex-col items-center py-8 z-50"
      >
        <div className="mb-10">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 cursor-pointer"
          >
            <span className="text-white font-bold text-xl">O</span>
          </motion.div>
        </div>

        <nav className="flex-1 flex flex-col gap-6">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => onViewChange(item.id as View)}
                title={item.label}
                className={`p-3 rounded-xl transition-all duration-200 group relative ${isActive
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
              >
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>

                {isActive && (
                  <motion.span
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"
                  />
                )}

                <span className="absolute left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>

        <motion.button
          whileHover={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
          onClick={onLogout}
          className="p-3 text-slate-400 rounded-xl transition-all group relative mt-auto"
        >
          <LogOut className="w-6 h-6" />
          <span className="absolute left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            Logout
          </span>
        </motion.button>
      </motion.aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <motion.nav
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 flex items-center justify-around px-4 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                className={`p-1.5 rounded-lg relative ${isActive ? 'bg-indigo-50' : ''}`}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -inset-1 border-2 border-indigo-600 rounded-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
              <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-1 p-2 text-slate-400"
        >
          <div className="p-1.5">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tighter">Exit</span>
        </button>
      </motion.nav>
    </>
  );
};

export default Sidebar;
