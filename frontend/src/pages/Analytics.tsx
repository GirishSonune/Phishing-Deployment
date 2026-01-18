import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  Activity,
  Calendar,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  Info
} from 'lucide-react';

import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Analytics: React.FC = () => {
  const { isDark: dark } = useTheme();
  const [activeTab, setActiveTab] = useState('Daily');
  const [timeRange, setTimeRange] = useState('30d'); // '7d', '30d', '90d', 'all'
  const [stats, setStats] = useState({
    total: 0,
    blocked: 0,
    health: '100%',
    active: 0
  });
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const { user } = useAuth(); // Get user from context

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return; // Wait for user

      try {
        const q = query(collection(db, 'history'), where("userId", "==", user.id));
        const querySnapshot = await getDocs(q);
        let docs = querySnapshot.docs.map(doc => doc.data());

        // 1. Global Time Filtering
        const now = new Date();
        docs = docs.filter(d => {
          if (!d.date) return false;
          const date = new Date(d.date);
          const diffTime = Math.abs(now.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (timeRange === '7d') return diffDays <= 7;
          if (timeRange === '30d') return diffDays <= 30;
          if (timeRange === '90d') return diffDays <= 90;
          return true; // 'all'
        });

        // 2. Stats Calculation
        const total = docs.length;
        const blocked = docs.filter(d => d.actionTaken === 'blocked').length;
        const clickedHighRisk = docs.filter(d => d.actionTaken === 'clicked' && d.riskScore > 50).length;
        const active = docs.filter(d => d.riskScore > 0).length;

        const healthScore = total > 0 ? ((1 - (clickedHighRisk / total)) * 100).toFixed(1) : '100';

        setStats({
          total,
          blocked,
          health: `${healthScore}%`,
          active
        });

        // 3. Risk Distribution
        const safe = docs.filter(d => d.riskScore < 30).length;
        const suspicious = docs.filter(d => d.riskScore >= 30 && d.riskScore < 70).length;
        const malicious = docs.filter(d => d.riskScore >= 70 && d.riskScore < 90).length;
        const critical = docs.filter(d => d.riskScore >= 90).length;

        setRiskDistribution([
          { name: 'Safe', value: total > 0 ? Math.round((safe / total) * 100) : 0 },
          { name: 'Suspicious', value: total > 0 ? Math.round((suspicious / total) * 100) : 0 },
          { name: 'Malicious', value: total > 0 ? Math.round((malicious / total) * 100) : 0 },
          { name: 'Critical', value: total > 0 ? Math.round((critical / total) * 100) : 0 },
        ]);

        // 4. Trend Data & Volume Analysis (Dynamic Grouping)
        // Grouping helper
        const groupData = (mode: string) => {
          const grouped: Record<string, number> = {};

          // Generate keys based on range to ensure 0s are filled
          // Simple approach: Iterate docs and group first, then fill gaps if needed ? 
          // Better: Generate generic time slots based on 'mode' and 'timeRange'.

          // For simplicity in this "small fix" iteration: We will map existing docs to slots.
          // Note: To show a nice "zero filled" chart we usually need to generate the axis.
          // Let's generate the axis based on the selected mode and range.

          let slots: string[] = [];
          const endDate = new Date();
          let daysToSubtract = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

          if (mode === 'Daily') {
            slots = [...Array(daysToSubtract)].map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - ((daysToSubtract - 1) - i));
              return d.toISOString().split('T')[0];
            });
          } else if (mode === 'Weekly') {
            // Approximate weeks
            const weeksToShow = Math.ceil(daysToSubtract / 7);
            slots = [...Array(weeksToShow)].map((_, i) => {
              return `Week ${weeksToShow - i}`; // Placeholder logic or specific dates
            });
            // Note: Implementing true ISO week grouping is complex without formatting lib. 
            // Fallback: Group by 7-day chunks from today.
          } else if (mode === 'Monthly') {
            const monthsToShow = Math.ceil(daysToSubtract / 30);
            slots = [...Array(monthsToShow)].map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - ((monthsToShow - 1) - i));
              return d.toLocaleString('default', { month: 'short' });
            });
          }

          // Initialize counts
          const slotCounts: Record<string, number> = {};
          if (mode === 'Daily') slots.forEach(s => slotCounts[s] = 0);
          // For Weekly/Monthly, initiation is tricker with variable names, let's just dynamic group

          docs.forEach(d => {
            const date = new Date(d.date);
            let key = '';

            if (mode === 'Daily') {
              key = date.toISOString().split('T')[0];
            } else if (mode === 'Weekly') {
              // Simple week number since epoch / 7 days
              const onejan = new Date(date.getFullYear(), 0, 1);
              const week = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
              key = `Week ${week}`; // Just global week number
            } else if (mode === 'Monthly') {
              key = date.toLocaleString('default', { month: 'short' });
            }

            if (mode === 'Daily') {
              if (slotCounts[key] !== undefined) slotCounts[key]++;
            } else {
              grouped[key] = (grouped[key] || 0) + 1;
            }
          });

          if (mode === 'Daily') return Object.entries(slotCounts).map(([name, count]) => ({ name: new Date(name).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), scans: count }));

          // Sort weak/month?
          // If we rely on generic object keys they might be unordered.
          // For MVP fix:
          return Object.entries(grouped).map(([name, count]) => ({ name, scans: count }));
        };

        // Re-implementing clearer 'Daily' only for the main Trend chart (always daily for granular view)
        // But respecting timeRange.
        const dailyTrend = groupData('Daily');

        // Use activeTab for the Volume Analysis
        let volumeData = [];
        if (activeTab === 'Daily') {
          volumeData = dailyTrend;
        } else if (activeTab === 'Weekly') {
          // simplified week grouping
          const weeks: Record<string, number> = {};
          docs.forEach(d => {
            const date = new Date(d.date);
            const dayDiff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
            const weekIdx = Math.floor(dayDiff / 7);
            const key = `Week -${weekIdx}`;
            weeks[key] = (weeks[key] || 0) + 1;
          });
          // Reverse to show oldest first?
          volumeData = Object.entries(weeks)
            .sort((a, b) => parseInt(b[0].split('-')[1]) - parseInt(a[0].split('-')[1])) // sort by week index descending (which is effectively chronological ascending: -3, -2, -1, 0)
            .map(([name, count]) => ({ name: name === 'Week -0' ? 'This Week' : name, scans: count }));
        } else {
          // Monthly
          const months: Record<string, number> = {};
          docs.forEach(d => {
            const date = new Date(d.date);
            const key = date.toLocaleString('default', { month: 'short' });
            months[key] = (months[key] || 0) + 1;
          });
          // Sort by month index?
          const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          volumeData = Object.entries(months)
            .sort((a, b) => monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]))
            .map(([name, count]) => ({ name, scans: count }));
        }

        setTrendData(dailyTrend);
        setScanHistory(volumeData.map(d => ({ date: d.name, count: d.scans })));

      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
    if (user?.id) {
      fetchData();
    }
  }, [activeTab, timeRange, user?.id]);

  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];
  const GRADIENT_COLORS = {
    primary: '#3b82f6',
    secondary: '#6366f1'
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121216] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: <span className="text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-blue-500/30 font-sans">
      <Navbar variant="app" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-blue-400 font-medium tracking-wider text-sm uppercase">Intelligence Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              Security Analytics
            </h1>
          </motion.div>

          {/* ... (Header buttons kept as is) ... */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <button
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[#121216] border border-white/5 rounded-xl text-sm font-medium hover:bg-[#1a1a20] transition-colors group"
              >
                <Calendar className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                {timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : timeRange === '90d' ? 'Last 3 Months' : 'All Time'}
                <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isTimeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {[
                      { label: 'Last 7 Days', value: '7d' },
                      { label: 'Last 30 Days', value: '30d' },
                      { label: 'Last 3 Months', value: '90d' },
                      { label: 'All Time', value: 'all' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setTimeRange(opt.value); setIsTimeDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${timeRange === opt.value ? 'text-blue-400 font-bold' : 'text-gray-400'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              <Filter className="w-4 h-4" />
              Filter Reports
            </button>
          </motion.div>
        </div>

        {/* Key Metrics Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {[
            { label: 'Total Scans', value: stats.total.toLocaleString(), icon: Shield, trend: 'All Time', color: 'blue' },
            { label: 'Threats Blocked', value: stats.blocked.toLocaleString(), icon: AlertTriangle, trend: 'Intervention', color: 'indigo' },
            { label: 'System Health', value: stats.health, icon: Activity, trend: 'Real-time', color: 'emerald' },
            { label: 'Risks Detected', value: stats.active.toString(), icon: ShieldCheck, trend: 'Alerts', color: 'blue' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: 'rgba(59, 130, 246, 0.4)' }}
              className="group p-6 bg-[#121216]/80 backdrop-blur-xl border border-white/5 rounded-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                  <stat.icon className={`w-6 h-6 ${i % 2 === 0 ? 'text-blue-400' : 'text-indigo-400'}`} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400`}>
                  {stat.trend}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-tight">{stat.label}</p>
                <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Threat Activity Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2 p-8 bg-[#121216]/80 backdrop-blur-xl border border-white/5 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold mb-1">Threat Activity</h2>
                <p className="text-gray-400 text-sm">Temporal analysis of security events</p>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GRADIENT_COLORS.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={GRADIENT_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="scans" stroke={GRADIENT_COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Risk Profile Donut Chart */}
          <motion.div variants={itemVariants} className="p-8 bg-[#121216]/80 backdrop-blur-xl border border-white/5 rounded-3xl flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold">Risk Profile</h2>
              <Info className="w-4 h-4 text-gray-500 cursor-help" />
            </div>
            <p className="text-gray-400 text-sm mb-8">Classification of entities detected</p>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="h-[240px] w-full relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold">{stats.total > 1000 ? (stats.total / 1000).toFixed(1) + 'k' : stats.total}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Entities</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={8} dataKey="value" animationDuration={1200}>
                      {riskDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mt-6">
                {riskDistribution.map((entry, index) => (
                  <div key={index} className="flex flex-col gap-1 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{entry.name}</span>
                    </div>
                    <span className="text-sm font-bold">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Weekly Volume Analysis */}
          <motion.div variants={itemVariants} className="lg:col-span-3 p-8 bg-[#121216]/80 backdrop-blur-xl border border-white/5 rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Volume Analysis</h2>
                <p className="text-gray-400 text-sm">Security checks distribution over time</p>
              </div>
              <div className="flex bg-[#0a0a0c] p-1 rounded-xl border border-white/5">
                {['Daily', 'Weekly', 'Monthly'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-500 hover:text-white'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scanHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" fill={GRADIENT_COLORS.primary} radius={[6, 6, 0, 0]} barSize={45} animationDuration={1000}>
                    {scanHistory.map((_, index) => (
                      <Cell key={`bar-cell-${index}`} fill={index === scanHistory.length - 1 ? GRADIENT_COLORS.primary : 'rgba(59, 130, 246, 0.4)'} className="transition-all duration-300 hover:fill-blue-400" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* Actionable Insights Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div whileHover={{ y: -5 }} className="group relative p-px rounded-3xl bg-gradient-to-br from-blue-500/20 via-transparent to-transparent">
            <div className="bg-[#121216] p-8 rounded-[23px] h-full relative z-10 border border-white/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Threat Forecast</h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-8 text-sm md:text-base">
                Based on current activity, your threat landscape is <span className="text-white font-semibold">{stats.total > 0 ? 'active' : 'dormant'}</span>.
                {stats.total === 0 ? ' No scans recorded recently.' : ` ${stats.blocked} threat(s) intercepted in total.`}
              </p>
              <button className="flex items-center gap-2 text-blue-400 text-sm font-bold group-hover:gap-4 transition-all">
                Access Detailed Intelligence <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="group relative p-px rounded-3xl bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent">
            <div className="bg-[#121216] p-8 rounded-[23px] h-full relative z-10 border border-white/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold">Aegis Score</h3>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-black text-white leading-none">{stats.health.replace('%', '')}</span>
                <div className="flex flex-col">
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Score</span>
                  <span className="text-gray-500 text-[10px]">Security Rating</span>
                </div>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-8">
                <motion.div initial={{ width: 0 }} animate={{ width: stats.health }} transition={{ duration: 2, ease: "circOut" }} className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
              </div>
              <button className="flex items-center gap-2 text-indigo-400 text-sm font-bold group-hover:gap-4 transition-all">
                Optimize Infrastructure <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;