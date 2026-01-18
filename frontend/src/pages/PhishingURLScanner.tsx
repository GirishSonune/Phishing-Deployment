import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import PhishingExplanation from './PhishingExplanation';

interface PhishingURLScannerProps {
  onBack: () => void;
}

const PhishingURLScanner: React.FC<PhishingURLScannerProps> = ({ onBack }) => {
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [actionSaved, setActionSaved] = useState(false);
  const { user } = useAuth();

  const analyzeURL = async (submittedUrl: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: submittedUrl }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching prediction:', error);
      throw error;
    }
  };

  const checkURL = async () => {
    if (!url.trim()) return;

    setIsChecking(true);
    setCurrentResult(null);
    setActionSaved(false);

    try {
      // Use the mock function
      const data = await analyzeURL(url);
      setCurrentResult(data);
    } catch (error: any) {
      console.error("Error checking URL:", error);
      alert("Failed to analyze URL.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleAction = async (action: 'blocked' | 'clicked' | 'ignored') => {
    if (!currentResult || !user) return;

    try {
      // Extract risk reasons from features where value is 1 (indicating presence of phishing characteristic)
      // or from shap values if high impact
      const riskReasons = Object.entries(currentResult.features || {})
        .filter(([key, value]) => String(value) === '1')
        .map(([key]) => key.replace(/_/g, ' '));

      const historyItem = {
        userId: user.id, // Associate with logged in user
        url: currentResult.url,
        riskScore: currentResult.riskScore,
        riskReasons: riskReasons.length > 0 ? riskReasons : ['AI Detection'],
        date: new Date().toISOString(),
        actionTaken: action,
        status: currentResult.prediction === 'phishing' ? 'Suspicious' : 'Safe'
      };

      await addDoc(collection(db, 'history'), {
        ...historyItem,
        timestamp: serverTimestamp()
      });

      setActionSaved(true);
      // Optional: Clear input or show success toast
    } catch (error) {
      console.error("Error saving action:", error);
      alert("Failed to save action to history.");
    }
  };

  const isPhishing = currentResult?.prediction?.toLowerCase() === 'phishing';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Navigation */}
      <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors group">
        <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Intelligence Center
      </button>

      {/* Hero Header */}
      <div className="text-center mb-12">
        <div className="inline-block p-4 rounded-full bg-slate-800 mb-6 shadow-lg border border-slate-700">
          <ShieldCheckIcon className="h-16 w-16 text-sky-500 mx-auto" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Phishing Detection System
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Our advanced AI analyzes structural patterns to identify malicious web links.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700 p-8 mb-12">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a website URL (e.g., https://example.com)..."
              className="w-full pl-12 pr-4 py-4 text-lg bg-slate-900/50 border-2 border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-white placeholder-slate-500 transition-all outline-none"
              onKeyPress={(e) => e.key === 'Enter' && checkURL()}
              disabled={isChecking}
            />
          </div>
          <button
            onClick={checkURL}
            disabled={!url.trim() || isChecking}
            className="bg-sky-600 hover:bg-sky-500 text-white py-4 px-10 rounded-xl text-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-600/20 flex items-center justify-center min-w-[160px]"
          >
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Analyzing...
              </>
            ) : (
              'Check Now'
            )}
          </button>
        </div>
      </div>

      {currentResult && (
        <div className="animate-in zoom-in-95 duration-500">
          {/* Result Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-2xl border ${isPhishing ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-300">Verdict</h3>
                {isPhishing ? <ExclamationTriangleIcon className="h-8 w-8 text-red-500" /> : <CheckCircleIcon className="h-8 w-8 text-green-500" />}
              </div>
              <p className={`text-4xl font-black ${isPhishing ? 'text-red-400' : 'text-green-400'}`}>
                {currentResult.prediction.toUpperCase()}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">Risk Probability</h3>
              <div className="text-3xl font-bold text-sky-400">{(currentResult.riskScore).toFixed(2)}%</div>
              <div className="overflow-hidden h-2 mt-4 rounded bg-slate-700">
                <div
                  style={{ width: `${currentResult.riskScore}%` }}
                  className={`h-full ${isPhishing ? 'bg-red-500' : 'bg-green-500'} transition-all duration-1000`}
                ></div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Target URL</h3>
              <p className="text-sky-400 font-mono text-xs break-all leading-relaxed">
                {currentResult.url}
              </p>
            </div>
          </div>

          {/* Detailed Explanation Component */}
          {isPhishing && (
            <PhishingExplanation
              features={currentResult.features}
              shapValues={currentResult.shap_values}
            />
          )}

          {/* Action Section - The critical part for the user task */}
          <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-3xl mb-8 text-center backdrop-blur-md mt-8">
            {!actionSaved ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">Take Action</h3>
                <p className="text-slate-400 mb-8">Your decision helps refine our threat intelligence.</p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  {isPhishing ? (
                    <>
                      <button
                        onClick={() => handleAction('blocked')}
                        className="flex-1 max-w-xs bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <ShieldCheckIcon className="h-5 w-5" /> Block & Report
                      </button>
                      <button
                        onClick={() => handleAction('clicked')}
                        className="flex-1 max-w-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-4 px-6 rounded-xl transition-colors"
                      >
                        Visit Despite Warning
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAction('ignored')} // For safe sites, "Ignored" means "Proceeded safely" in this context logic
                        className="flex-1 max-w-xs bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircleIcon className="h-5 w-5" /> Mark as Safe & Proceed
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="py-2">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-500/20 text-green-400 mb-4">
                  <FingerPrintIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Action Recorded</h3>
                <p className="text-slate-400">This event has been logged to your dashboard.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhishingURLScanner;