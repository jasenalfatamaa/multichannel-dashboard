
import React, { useState } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Instagram,
  Send,
  Music,
  MessageSquare,
  Youtube,
  Globe,
  Twitter,
  Slack,
  Linkedin,
  Facebook,
  Github,
  Figma,
  Dribbble,
  Chrome,
  Cloud,
  Cpu,
  Layers,
  Monitor,
  Smartphone,
  Bell,
  Calendar,
  Zap,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { UserSession } from '../types';
import { authService } from '../services/apiService';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

const TEAM_KEY = 'omniai_team_members';
const STORAGE_KEY = 'omniai_user_profile';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const session = await authService.login(email, password);
      onLogin(session);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || 'Email atau password salah. Coba lagi.');
      setIsLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    },
  };

  const floatingIcons = [
    { icon: MessageCircle, x: '5%', y: '10%', size: 70, duration: 25, delay: 0 },
    { icon: Instagram, x: '85%', y: '15%', size: 85, duration: 30, delay: 2 },
    { icon: Send, x: '75%', y: '80%', size: 70, duration: 28, delay: 1 },
    { icon: Music, x: '10%', y: '85%', size: 75, duration: 22, delay: 3 },
    { icon: MessageSquare, x: '20%', y: '40%', size: 60, duration: 35, delay: 4 },
    { icon: Youtube, x: '92%', y: '50%', size: 75, duration: 27, delay: 1.5 },
    { icon: Twitter, x: '40%', y: '5%', size: 55, duration: 32, delay: 5 },
    { icon: Globe, x: '55%', y: '92%', size: 50, duration: 24, delay: 2.5 },
    { icon: Slack, x: '30%', y: '75%', size: 65, duration: 29, delay: 6 },
    { icon: Linkedin, x: '70%', y: '5%', size: 55, duration: 31, delay: 3.5 },
    { icon: Facebook, x: '65%', y: '45%', size: 60, duration: 26, delay: 0.8 },
    { icon: Github, x: '15%', y: '25%', size: 50, duration: 33, delay: 4.5 },
    { icon: Figma, x: '82%', y: '35%', size: 58, duration: 29, delay: 1.2 },
    { icon: Dribbble, x: '45%', y: '82%', size: 45, duration: 24, delay: 5.2 },
    { icon: Chrome, x: '5%', y: '55%', size: 52, duration: 30, delay: 2.1 },
    { icon: Cloud, x: '90%', y: '88%', size: 48, duration: 22, delay: 3.8 },
    { icon: Cpu, x: '35%', y: '15%', size: 40, duration: 34, delay: 1.5 },
    { icon: Layers, x: '75%', y: '65%', size: 42, duration: 28, delay: 6.2 },
    { icon: Monitor, x: '50%', y: '30%', size: 45, duration: 31, delay: 0.4 },
    { icon: Smartphone, x: '12%', y: '68%', size: 48, duration: 25, delay: 4.8 },
    { icon: Bell, x: '88%', y: '8%', size: 38, duration: 19, delay: 2.6 },
    { icon: Calendar, x: '25%', y: '92%', size: 35, duration: 36, delay: 5.5 },
    { icon: Zap, x: '60%', y: '12%', size: 42, duration: 18, delay: 1.1 },
    { icon: Sparkles, x: '38%', y: '55%', size: 30, duration: 20, delay: 3.2 },
    { icon: MessageCircle, x: '48%', y: '72%', size: 55, duration: 32, delay: 0.9 },
    { icon: Send, x: '5%', y: '28%', size: 48, duration: 24, delay: 4.1 },
    { icon: Instagram, x: '95%', y: '30%', size: 52, duration: 26, delay: 1.8 },
    { icon: Github, x: '55%', y: '40%', size: 38, duration: 35, delay: 5.7 },
    { icon: MessageSquare, x: '78%', y: '20%', size: 45, duration: 27, delay: 2.4 },
    { icon: Music, x: '32%', y: '88%', size: 50, duration: 30, delay: 3.9 },
  ];

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">

      {/* --- BACKGROUND LAYER --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {floatingIcons.map((item, idx) => (
          <motion.div
            key={idx}
            className="absolute text-indigo-600/40"
            initial={{
              left: item.x,
              top: item.y,
              opacity: 0,
              scale: 0.8
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              x: [-150, 150, -150],
              y: [-250, 250, -250],
              rotate: [0, 180, -180, 0],
              scale: [1, 1.2, 0.8, 1]
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay
            }}
          >
            <item.icon size={item.size} strokeWidth={1.4} />
          </motion.div>
        ))}
      </div>

      {/* --- Login Card Container --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl p-1 bg-gradient-to-b from-white/95 to-white/70 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] shadow-[0_64px_120px_-30px_rgba(79,70,229,0.4)] border border-white relative z-10 mx-4"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 rounded-[28px] md:rounded-[44px] p-6 md:p-10 backdrop-blur-md border border-white/40"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-6 md:mb-10">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-14 h-14 md:w-20 md:h-20 bg-indigo-600 rounded-[20px] md:rounded-[28px] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl shadow-indigo-200 relative group cursor-pointer"
            >
              <span className="text-white text-2xl md:text-4xl font-black">O</span>
              <motion.div
                animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-indigo-400 rounded-[28px] -z-10 blur-lg"
              />
            </motion.div>
            <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
              OmniAI <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-indigo-500 fill-indigo-500" />
            </h1>
            <p className="text-slate-400 mt-1 md:mt-2 text-[10px] md:text-sm font-medium">Empowering Multi-Channel Connections</p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: [0, -10, 10, -10, 10, 0],
                  transition: { duration: 0.4 }
                }}
                exit={{ opacity: 0, x: 20 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase tracking-wider"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <motion.div variants={itemVariants} className="space-y-1 md:space-y-2">
              <label className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-11 pr-5 py-3 md:py-4 bg-white/90 border border-slate-100 rounded-[16px] md:rounded-3xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-medium placeholder:text-slate-300 shadow-sm"
                  placeholder="name@company.com"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1 md:space-y-2">
              <label className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-11 pr-12 py-3 md:py-4 bg-white/90 border border-slate-100 rounded-[16px] md:rounded-3xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-medium placeholder:text-slate-300 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-indigo-500 transition-colors rounded-lg hover:bg-slate-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 md:py-5 bg-indigo-600 text-white rounded-[16px] md:rounded-[24px] font-bold text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-[2px] border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs">Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-[10px] md:text-sm">Access Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
