
import React, { useState, useMemo, useRef } from 'react';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  MailOpen,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  CheckCircle2,
  Search,
  Brain,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHANNEL_ICONS } from '../constants';
import { Conversation, Customer } from '../types';

interface DashboardOverviewProps {
  conversations: Conversation[];
  customers: Customer[];
}

type TimeRange = '7d' | '30d' | '1y';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
  }
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ conversations, customers }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStage, setOptimizationStage] = useState(0);
  const [hasOptimized, setHasOptimized] = useState(false);
  const containerRef = useRef<SVGSVGElement>(null);

  const totalConversations = conversations.length;
  const unreadMessages = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);
  const totalCustomers = customers.length;

  const handleOptimize = () => {
    setIsOptimizing(true);
    setOptimizationStage(0);
    setHasOptimized(false);

    const stages = [
      { delay: 800, stage: 1 }, 
      { delay: 1800, stage: 2 }, 
      { delay: 2800, stage: 3 }, 
      { delay: 3500, stage: 4 }  
    ];

    stages.forEach(({ delay, stage }) => {
      setTimeout(() => {
        setOptimizationStage(stage);
        if (stage === 4) {
          setIsOptimizing(false);
          setHasOptimized(true);
        }
      }, delay);
    });
  };

  const getPercentage = (count: number) => {
    if (totalConversations === 0) return 0;
    return Math.round((count / totalConversations) * 100);
  };

  const trendResult = useMemo(() => {
    let data: { label: string; dateStart: Date; dateEnd: Date; inbound: number; resolved: number }[] = [];

    if (timeRange === '7d') {
      data = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStart = new Date(d);
        dateStart.setHours(0,0,0,0);
        const dateEnd = new Date(d);
        dateEnd.setHours(23,59,59,999);
        const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        return { label, dateStart, dateEnd, inbound: 0, resolved: 0 };
      });
    } else if (timeRange === '30d') {
      data = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStart = new Date(d);
        dateStart.setHours(0,0,0,0);
        const dateEnd = new Date(d);
        dateEnd.setHours(23,59,59,999);
        const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        return { label, dateStart, dateEnd, inbound: 0, resolved: 0 };
      });
    } else if (timeRange === '1y') {
      data = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        const label = d.toLocaleDateString('id-ID', { month: 'short' });
        const dateStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
        const dateEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        return { label, dateStart, dateEnd, inbound: 0, resolved: 0 };
      });
    }

    conversations.forEach(conv => {
      // Hitung New Inbound Conversations (Kapan tiket dimulai)
      const startDate = new Date(conv.startedAt);
      data.forEach(d => {
        if (startDate >= d.dateStart && startDate <= d.dateEnd) {
          d.inbound++;
        }
      });

      // Hitung Resolved Conversations (Kapan tiket selesai)
      if (conv.status === 'resolved' && conv.resolvedAt) {
        const resDate = new Date(conv.resolvedAt);
        data.forEach(d => {
          if (resDate >= d.dateStart && resDate <= d.dateEnd) {
            d.resolved++;
          }
        });
      }
    });

    const maxVal = Math.max(...data.map(d => Math.max(d.inbound, d.resolved)), 8);
    const maxScale = Math.ceil(maxVal / 4) * 4;

    return {
      points: data.map(d => ({ 
        label: d.label, 
        inbound: d.inbound, 
        resolved: d.resolved,
        inboundPercent: (d.inbound / maxScale) * 100,
        resolvedPercent: (d.resolved / maxScale) * 100
      })),
      maxScale
    };
  }, [timeRange, conversations]);

  const chartHeight = 440;
  const chartWidth = 800;
  const paddingX = 60; 
  const paddingTop = 40;
  const paddingBottom = 50; 

  const points = useMemo(() => {
    const w = chartWidth - paddingX - 40;
    const h = chartHeight - paddingTop - paddingBottom;
    return trendResult.points.map((d, i) => {
      const x = paddingX + (i / (trendResult.points.length - 1)) * w;
      const yInbound = chartHeight - paddingBottom - (d.inboundPercent / 100) * h;
      const yResolved = chartHeight - paddingBottom - (d.resolvedPercent / 100) * h;
      return { x, yInbound, yResolved, ...d };
    });
  }, [trendResult, chartWidth, chartHeight, paddingTop, paddingBottom]);

  const getSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    return pts.reduce((acc, curr, i, a) => {
      if (i === 0) return `M ${curr.x} ${curr.y}`;
      const prev = a[i - 1];
      const cx = (prev.x + curr.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }, '');
  };

  const inboundPath = useMemo(() => getSmoothPath(points.map(p => ({ x: p.x, y: p.yInbound }))), [points]);
  const resolvedPath = useMemo(() => getSmoothPath(points.map(p => ({ x: p.x, y: p.yResolved }))), [points]);
  
  const inboundFill = useMemo(() => {
    if (points.length === 0) return '';
    return `${inboundPath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
  }, [inboundPath, points, chartHeight, paddingBottom]);

  const yAxisMarkers = [
    trendResult.maxScale, 
    (trendResult.maxScale * 3) / 4, 
    trendResult.maxScale / 2, 
    trendResult.maxScale / 4, 
    0
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * chartWidth;
    
    let closest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  };

  const stats = [
    { label: 'Conversations', value: totalConversations.toLocaleString(), change: '+12%', icon: MessageSquare, positive: true, arrow: 'up' },
    { label: 'Unread Message', value: unreadMessages.toString(), change: unreadMessages > 0 ? `+${unreadMessages}` : '0', icon: MailOpen, positive: unreadMessages === 0, isWarning: unreadMessages > 0, arrow: unreadMessages > 0 ? 'up' : 'down' },
    { label: 'Total Customers', value: totalCustomers.toLocaleString(), change: '+4', icon: Users, positive: true, arrow: 'up' },
    { label: 'Avg. Response', value: '1.4m', change: '-22%', icon: Clock, positive: true, arrow: 'down' },
  ];

  const channelStats = [
    { name: 'WhatsApp', percentage: getPercentage(conversations.filter(c => c.channel === 'whatsapp').length), color: 'bg-emerald-500', channel: 'whatsapp' },
    { name: 'Instagram', percentage: getPercentage(conversations.filter(c => c.channel === 'instagram').length), color: 'bg-pink-500', channel: 'instagram' },
    { name: 'Telegram', percentage: getPercentage(conversations.filter(c => c.channel === 'telegram').length), color: 'bg-sky-500', channel: 'telegram' },
  ];

  const optimizationResults = [
    { label: 'Drafts Updated', value: '12', icon: MessageSquare },
    { label: 'Archived', value: '4', icon: MailOpen },
    { label: 'Precision', value: '+18%', icon: Brain },
    { label: 'Efficiency', value: '100%', icon: Zap }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4 md:px-0 relative">
      <AnimatePresence>
        {isOptimizing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[40px] p-8 md:p-12 max-w-lg w-full shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 relative overflow-hidden">
                    <Sparkles className="w-6 h-6 text-white animate-pulse relative z-10" />
                    <motion.div 
                      animate={{ scale: [1, 2, 1], rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-indigo-400 opacity-30"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">OmniAI Optimizer</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System is being tuned</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { id: 1, label: 'Pemindaian Database', icon: Search },
                  { id: 2, label: 'Analisis Sentimen AI', icon: Brain },
                  { id: 3, label: 'Optimasi Knowledge Base', icon: Zap },
                  { id: 4, label: 'Laporan Selesai', icon: CheckCircle2 }
                ].map((step) => {
                  const isCompleted = optimizationStage >= step.id;
                  const isActive = optimizationStage === step.id - 1;
                  
                  return (
                    <div key={step.id} className="flex items-center gap-4 group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 
                        isActive ? 'bg-white border-indigo-200 text-indigo-600 shadow-lg scale-110' : 
                        'bg-slate-50 border-slate-100 text-slate-300'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-black transition-colors ${
                          isCompleted ? 'text-slate-900' : 
                          isActive ? 'text-indigo-600' : 'text-slate-300'
                        }`}>
                          {step.label}
                        </p>
                        {isActive && (
                          <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <motion.div 
                              initial={{ x: '-100%' }}
                              animate={{ x: '0%' }}
                              transition={{ duration: 1 }}
                              className="h-full bg-indigo-600 w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8 md:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight text-center sm:text-left">Executive Summary</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-lg font-medium">Monitoring your multi-channel communication growth.</p>
        </div>
      </motion.header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10"
      >
        {stats.map((stat) => (
          <motion.div 
            key={stat.label}
            variants={itemVariants}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`p-3 rounded-2xl ${stat.isWarning ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'} transition-all duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.arrow === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
            <p className={`text-3xl font-black tracking-tight ${stat.isWarning ? 'text-rose-600' : 'text-slate-800'}`}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[48px] border border-slate-200 shadow-sm flex flex-col overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Conversations Trends</h3>
              <p className="text-sm text-slate-400 mt-2 font-medium">Activity trends by ticket initiation and resolution dates</p>
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1 border border-slate-100">
              {(['7d', '30d', '1y'] as TimeRange[]).map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-5 py-2 text-[11px] font-black rounded-xl transition-all uppercase tracking-widest ${
                    timeRange === range ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {range === '7d' ? '1W' : range === '30d' ? '1M' : '1Y'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col relative" onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)}>
            <div className="flex-1 w-full relative">
              <div 
                className="absolute left-0 pointer-events-none w-[50px] flex flex-col justify-between text-right pr-4"
                style={{ top: `${paddingTop}px`, bottom: `${paddingBottom}px` }}
              >
                 {yAxisMarkers.map((val, i) => (
                   <div key={i} className="h-0 flex items-center justify-end">
                     <span className="text-xs font-bold text-slate-400 leading-none">{val}</span>
                   </div>
                 ))}
              </div>

              <svg 
                ref={containerRef}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full overflow-visible" 
                preserveAspectRatio="none"
              >
                {yAxisMarkers.map((_, i) => {
                  const yPos = paddingTop + (i * (chartHeight - paddingTop - paddingBottom)) / 4;
                  return (
                    <line 
                      key={i} 
                      x1={paddingX} 
                      y1={yPos} 
                      x2={chartWidth - 20} 
                      y2={yPos} 
                      stroke="#f1f5f9" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4" 
                    />
                  );
                })}

                <AnimatePresence>
                  {hoverIndex !== null && (
                    <motion.line 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      x1={points[hoverIndex].x} 
                      y1={paddingTop} 
                      x2={points[hoverIndex].x} 
                      y2={chartHeight - paddingBottom} 
                      stroke="#cbd5e1" 
                      strokeWidth="1.5" 
                    />
                  )}
                </AnimatePresence>

                <motion.path 
                  key={`fill-${timeRange}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.05 }}
                  d={inboundFill} 
                  fill="#4f46e5" 
                />

                <motion.path 
                  key={`res-${timeRange}`}
                  initial={{ pathLength: 0, opacity: 0 }} 
                  animate={{ pathLength: 1, opacity: 1 }} 
                  d={resolvedPath} 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2" 
                  strokeDasharray="6 6"
                  transition={{ duration: 1 }} 
                />

                <motion.path 
                  key={`inb-${timeRange}`}
                  initial={{ pathLength: 0, opacity: 0 }} 
                  animate={{ pathLength: 1, opacity: 1 }} 
                  d={inboundPath} 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  transition={{ duration: 1 }} 
                />

                {points.map((p, i) => (
                  ((timeRange === '30d' && i % 4 === 0) || (timeRange === '7d') || (timeRange === '1y' && i % 2 === 0)) && (
                    <text
                      key={i}
                      x={p.x}
                      y={chartHeight - 15}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest"
                      style={{ fontSize: '10px' }}
                    >
                      {p.label}
                    </text>
                  )
                ))}

                {hoverIndex !== null && (
                  <g>
                    <motion.circle initial={{ r: 0 }} animate={{ r: 6 }} cx={points[hoverIndex].x} cy={points[hoverIndex].yInbound} fill="#4f46e5" stroke="white" strokeWidth="2.5" />
                    <motion.circle initial={{ r: 0 }} animate={{ r: 4 }} cx={points[hoverIndex].x} cy={points[hoverIndex].yResolved} fill="#10b981" stroke="white" strokeWidth="2" />
                  </g>
                )}

                <foreignObject x={0} y={0} width="100%" height="100%" className="pointer-events-none overflow-visible">
                  <AnimatePresence>
                    {hoverIndex !== null && (() => {
                      const isTooHigh = points[hoverIndex].yInbound < 150;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            x: points[hoverIndex].x - 60,
                            y: isTooHigh ? points[hoverIndex].yInbound + 20 : points[hoverIndex].yInbound - 120
                          }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 w-[140px] absolute z-50"
                        >
                          <p className="text-[11px] font-black text-slate-800 mb-2 uppercase tracking-widest">{points[hoverIndex].label}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-500 uppercase">Started :</span>
                              <span className="text-[10px] font-black text-slate-900">{points[hoverIndex].inbound}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-500 uppercase">Resolved :</span>
                              <span className="text-[10px] font-black text-slate-900">{points[hoverIndex].resolved}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </foreignObject>
              </svg>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6 md:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm flex flex-col flex-1"
          >
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Channel Distribution</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">Active touchpoints</p>
            </div>
            <div className="space-y-10 flex-1 flex flex-col justify-center">
              {channelStats.map((item, idx) => (
                <div key={item.name} className="group/channel">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        className="p-2 bg-slate-50 rounded-xl border border-slate-100 group-hover/channel:bg-indigo-50 group-hover/channel:border-indigo-100 transition-colors"
                      >
                        {CHANNEL_ICONS[item.channel as any]}
                      </motion.div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest group-hover/channel:text-indigo-600 transition-colors">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{item.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${item.percentage}%` }} 
                      transition={{ duration: 1.2, delay: 0.6 + idx * 0.1, ease: "easeOut" }} 
                      className={`h-full rounded-full ${item.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-indigo-900 p-8 rounded-[48px] text-white relative overflow-hidden group shadow-2xl shadow-indigo-200 flex flex-col justify-between min-h-[360px]"
          >
             {/* Background Decoration */}
             <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-indigo-500 rounded-full opacity-20 blur-3xl pointer-events-none"
             />

             <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center gap-3 mb-8">
                 <div className="p-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                   <motion.span 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute" 
                   />
                   <Sparkles className="w-5 h-5 text-indigo-100" />
                 </div>
                 <span className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.25em]">OmniAI Analysis</span>
               </div>
               
               <div className="flex-1">
                <AnimatePresence mode="wait">
                  {!hasOptimized ? (
                    <motion.div 
                      key="initial"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="p-5 bg-white/5 rounded-[28px] border border-white/10 backdrop-blur-sm flex items-start gap-4 hover:bg-white/10 transition-colors cursor-default">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                          <Brain className="w-4 h-4 text-indigo-200" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">SLA Health</p>
                          <p className="text-xs font-medium text-white leading-relaxed">Average resolution time: 1.4h</p>
                        </div>
                      </div>
                      <div className="p-5 bg-white/5 rounded-[28px] border border-white/10 backdrop-blur-sm flex items-start gap-4 hover:bg-white/10 transition-colors cursor-default">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                          <Zap className="w-4 h-4 text-indigo-200" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Suggestion engine</p>
                          <p className="text-xs font-medium text-white leading-relaxed">Ready to prioritize pending messages.</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Efficiency Optimized</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {optimizationResults.map((res, i) => (
                          <motion.div 
                            key={res.label} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 bg-white/10 rounded-[24px] border border-white/10 hover:bg-white/20 transition-all cursor-default"
                          >
                            <res.icon className="w-3.5 h-3.5 text-indigo-200 mb-2" />
                            <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">{res.label}</p>
                            <p className="text-xl font-black text-white leading-none">{res.value}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
               </div>

               <div className="mt-8">
                <motion.button 
                  onClick={handleOptimize}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all group/btn ${
                    hasOptimized 
                      ? 'bg-indigo-500/30 text-white border border-white/20 hover:bg-indigo-500/40' 
                      : 'bg-white text-indigo-900 shadow-indigo-500/20 hover:bg-indigo-50'
                  }`}
                >
                  {hasOptimized ? 'Re-optimize Workflow' : 'Optimize Workflow'}
                  {hasOptimized ? <RefreshCcw className="w-4 h-4 text-indigo-200" /> : <Zap className="w-4 h-4 fill-indigo-900 group-hover/btn:animate-bounce" />}
                </motion.button>
               </div>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
