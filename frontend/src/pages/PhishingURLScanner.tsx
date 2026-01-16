import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import PhishingExplanation from './PhishingExplanation';

// Register ChartJS for technical visualizations
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PhishingURLScannerProps {
  onBack: () => void;
}

const PhishingURLScanner: React.FC<PhishingURLScannerProps> = ({ onBack }) => {
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);

  /**
   * Main AI Model Connection
   * Calls the backend /predict endpoint to get phishing scores and features
   */
  const checkURL = async () => {
    if (!url.trim()) return;

    setIsChecking(true);
    setCurrentResult(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction');
      }

      const data = await response.json();
      setCurrentResult(data);

    } catch (error: any) {
      console.error("Error checking URL:", error);
      alert(`Failed to analyze the URL. ${error.message || "Please ensure the backend server is running."}`);
    } finally {
      setIsChecking(false);
    }
  };

  // Technical chart data for SHAP values
  const chartData = currentResult?.shap_values ? {
    labels: Object.keys(currentResult.shap_values),
    datasets: [
      {
        label: 'Impact on Prediction (Positive = Phishing Risk)',
        data: Object.values(currentResult.shap_values),
        backgroundColor: Object.values(currentResult.shap_values).map((val: any) =>
          val > 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)'
        ),
        borderColor: Object.values(currentResult.shap_values).map((val: any) =>
          val > 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'
        ),
        borderWidth: 1,
      },
    ],
  } : null;

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

      {/* Search/Analyze Input */}
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
          {/* Main Status Cards */}
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
              <div className="text-3xl font-bold text-sky-400">{(currentResult.riskScore || 0).toFixed(2)}%</div>
              <div className="overflow-hidden h-2 mt-4 rounded bg-slate-700">
                <div 
                  style={{ width: `${currentResult.riskScore || 0}%` }} 
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

          {/* EXPLAINABILITY COMPONENT - Only shown if prediction is Phishing */}
          {isPhishing && (
            <PhishingExplanation 
              features={currentResult.features || {}} 
              shapValues={currentResult.shap_values} 
            />
          )}

          {/* Technical Visualizations */}
          <div className={`mt-8 grid grid-cols-1 ${isPhishing ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8`}>
            {/* Technical Chart - Only shown if prediction is Phishing */}
            {isPhishing && (
              <div className="p-8 rounded-3xl bg-slate-800 border border-slate-700 shadow-xl min-h-[400px]">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                  <ChartBarIcon className="h-6 w-6 text-sky-500" /> Technical Influence Map
                </h3>
                {chartData ? (
                  <div className="h-[300px]">
                    <Bar 
                      data={chartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                        }
                      }} 
                    />
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500 italic">
                    No technical SHAP data provided by the AI model.
                  </div>
                )}
              </div>
            )}

            {/* Feature Table - Always shown but expands if Map is hidden */}
            <div className="p-8 rounded-3xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
              <h3 className="text-xl font-bold text-white mb-8">Extracted Key Features</h3>
              <div className={`grid grid-cols-1 ${isPhishing ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar`}>
                {currentResult.features && Object.entries(currentResult.features).map(([key, value]: any) => (
                  <div key={key} className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700 flex flex-col justify-between hover:border-sky-500/30 transition-colors">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block truncate">
                      {key}
                    </span>
                    <div className="flex justify-between items-end">
                      <span className={`text-xl font-mono font-bold ${Number(value) === 1 ? 'text-red-400' : 'text-green-400'}`}>
                        {String(value)}
                      </span>
                      <div className={`h-1.5 w-1.5 rounded-full ${Number(value) === 1 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhishingURLScanner;