import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import PhishingURLScanner from './PhishingURLScanner';
import SMSSmishingScanner from './SMSSmishingScanner';
import { 
  GlobeAltIcon, 
  ChatBubbleBottomCenterTextIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'url', 'sms'

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-sky-500 selection:text-white">
      <Navbar variant="app" />

      <main className="max-w-6xl mx-auto pt-24 pb-12 px-4">
        {activeTab === 'menu' && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight bg-gradient-to-r from-white via-sky-400 to-sky-600 bg-clip-text text-transparent">
                Threat Intelligence Center
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Select a specialized detection engine to analyze potential security threats using advanced AI.
              </p>
            </div>

            {/* Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* URL Phishing Card */}
              <button 
                onClick={() => setActiveTab('url')}
                className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 p-8 rounded-3xl transition-all duration-300 text-left overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <GlobeAltIcon className="h-32 w-32 text-sky-500" />
                </div>
                <div className="relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6 border border-sky-500/20 group-hover:scale-110 transition-transform">
                    <GlobeAltIcon className="h-8 w-8 text-sky-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-sky-400 transition-colors">URL Phishing</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Analyze website links for structural anomalies, malicious patterns, and phishing signatures.
                  </p>
                  <div className="flex items-center text-sky-500 font-bold text-sm uppercase tracking-widest gap-2">
                    Open Scanner <BoltIcon className="h-4 w-4" />
                  </div>
                </div>
              </button>

              {/* SMS Smishing Card */}
              <button 
                onClick={() => setActiveTab('sms')}
                className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 p-8 rounded-3xl transition-all duration-300 text-left overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ChatBubbleBottomCenterTextIcon className="h-32 w-32 text-purple-500" />
                </div>
                <div className="relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition-colors">SMS Smishing</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Scan text messages for linguistic cues, fraudulent lures, and social engineering attempts.
                  </p>
                  <div className="flex items-center text-purple-500 font-bold text-sm uppercase tracking-widest gap-2">
                    Open Scanner <BoltIcon className="h-4 w-4" />
                  </div>
                </div>
              </button>
            </div>

            {/* Security Note */}
            <div className="mt-20 flex items-center justify-center gap-4 text-slate-500 bg-slate-800/30 w-fit mx-auto px-6 py-3 rounded-full border border-slate-800">
              <ShieldCheckIcon className="h-5 w-5" />
              <span className="text-sm font-medium italic">Powered by Aegis AI Detection Engine v2.0</span>
            </div>
          </div>
        )}

        {activeTab === 'url' && (
          <PhishingURLScanner onBack={() => setActiveTab('menu')} />
        )}

        {activeTab === 'sms' && (
          <SMSSmishingScanner onBack={() => setActiveTab('menu')} />
        )}
      </main>
    </div>
  );
}