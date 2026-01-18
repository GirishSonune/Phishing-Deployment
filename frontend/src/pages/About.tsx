import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Target, 
  Cpu, 
  Globe, 
  Users, 
  Zap, 
  Activity, 
  ChevronRight,
  Lock,
  Eye,
  Server,
  Bell,
  User,
  Search
} from 'lucide-react';

// --- INLINED NAVBAR FOR PREVIEW STABILITY ---
const Navbar = () => (
  <nav className="border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">AEGIS</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {['Home', 'Dashboard', 'Analytics', 'About'].map((item) => (
            <button key={item} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${item === 'About' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/10 flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  </nav>
);

const About: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-blue-500/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black uppercase tracking-widest text-blue-400">Our Mission</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
              Fortifying the Digital <br />
              Frontier with AI.
            </h1>
            <p className="max-w-3xl mx-auto text-gray-400 text-lg md:text-xl font-medium leading-relaxed">
              AEGIS is a next-generation cybersecurity ecosystem dedicated to identifying, 
              analyzing, and neutralizing sophisticated digital threats before they breach your perimeter.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values / Features */}
      <section className="py-20 bg-[#0a0a0c] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Advanced AI Scanning",
                desc: "Utilizing deep learning models to detect phishing, smishing, and social engineering patterns in real-time.",
                icon: Cpu,
                color: "blue"
              },
              {
                title: "Zero-Trust Protocol",
                desc: "Architecture built on the foundation that every entity is a potential threat until cryptographically verified.",
                icon: Shield,
                color: "indigo"
              },
              {
                title: "Global Intelligence",
                desc: "Aggregating threat signatures from across the dark web to provide proactive defense mechanisms.",
                icon: Globe,
                color: "purple"
              }
            ].map((value, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group p-8 bg-[#121216]/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-blue-600/10 transition-colors`}>
                  <value.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-4">{value.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">
                  {value.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* System Architecture Section */}
      <section className="py-24 border-y border-white/5 bg-[#0e0e11]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-black tracking-tighter mb-6">
                Engineered for <br />
                Extreme Resilience.
              </h2>
              <div className="space-y-6">
                {[
                  { label: "Predictive Analytics", icon: Activity },
                  { label: "Encrypted Data Pipelines", icon: Lock },
                  { label: "Distributed Scanner Nodes", icon: Server }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600 transition-colors">
                      <item.icon className="w-5 h-5 text-blue-400 group-hover:text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
              <button className="mt-10 flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase tracking-wider rounded-2xl hover:bg-gray-200 transition-all">
                Technical Whitepaper <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-600/20 to-transparent rounded-[3rem] border border-white/10 flex items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="relative z-10 w-full h-full border-2 border-dashed border-blue-500/30 rounded-full animate-[spin_20s_linear_infinite] flex items-center justify-center">
                   <Target className="w-20 h-20 text-blue-500/50" />
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                </div>
                <Shield className="absolute w-32 h-32 text-white/10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Users className="w-12 h-12 text-blue-500 mx-auto mb-8" />
            <h2 className="text-4xl font-black tracking-tighter mb-8">Human Intelligence, Machine Speed.</h2>
            <p className="text-gray-400 text-lg leading-relaxed font-medium italic">
              "We believe that cybersecurity is not just about code and algorithms; it's about preserving human 
              privacy and trust in an increasingly interconnected world. AEGIS was born from the need to level 
              the playing field against automated adversaries."
            </p>
            <div className="mt-8 flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-blue-600 mb-2 border-2 border-white/10" />
               <span className="text-sm font-black uppercase tracking-widest">Aegis Core Team</span>
               <span className="text-xs text-gray-600 font-bold mt-1">Founders & Lead Architects</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <h3 className="text-2xl font-black tracking-tight mb-6">Ready to fortify your perimeter?</h3>
           <div className="flex flex-wrap justify-center gap-4">
              <button className="px-10 py-4 bg-blue-600 rounded-2xl font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                Get Started
              </button>
              <button className="px-10 py-4 bg-[#121216] border border-white/10 rounded-2xl font-black uppercase tracking-wider hover:bg-white/5 transition-all">
                Contact Sales
              </button>
           </div>
           <p className="mt-12 text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">
              © 2024 AEGIS DEFENSE SYSTEMS • ALL RIGHTS RESERVED
           </p>
        </div>
      </footer>
    </div>
  );
};

export default About;