import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { MagnifyingGlassIcon, ShieldCheckIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);

  const checkURL = async () => {
    if (!url.trim()) return;

    setIsChecking(true);
    setCurrentResult(null); // Reset previous result

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/predict';
      const response = await fetch(apiUrl, {
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

  // Prepare Chart Data if SHAP values exist
  const chartData = currentResult?.shap_values ? {
    labels: Object.keys(currentResult.shap_values),
    datasets: [
      {
        label: 'Impact on Prediction (Positive = Phishing)',
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Feature Importance (SHAP Values)',
        color: '#94a3b8'
      },
    },
    scales: {
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-sky-500 selection:text-white">
      <Navbar variant="app" />

      <div className="max-w-6xl mx-auto pt-16 pb-12 px-4">

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 rounded-full bg-slate-800 mb-6 shadow-lg shadow-sky-900/20 border border-slate-700">
            <ShieldCheckIcon className="h-16 w-16 text-sky-500 mx-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Phishing Detection System
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Enter a website URL to check for potential phishing threats using our advanced AI engine.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700 p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter a website URL (e.g., https://example.com)..."
                className="w-full pl-12 pr-4 py-4 text-lg bg-slate-900/50 border-2 border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-white placeholder-slate-500 transition-all duration-200"
                onKeyPress={(e) => e.key === 'Enter' && checkURL()}
                disabled={isChecking}
              />
            </div>

            <button
              onClick={checkURL}
              disabled={!url.trim() || isChecking}
              className="md:w-auto w-full bg-sky-600 text-white py-4 px-8 rounded-xl text-lg font-bold hover:bg-sky-500 focus:ring-4 focus:ring-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg shadow-sky-600/20"
            >
              {isChecking ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Analyzing...
                </>
              ) : (
                'Check Now'
              )}
            </button>
          </div>

          {/* Sample URLs */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <span className="text-slate-400 text-sm py-1.5">Try samples:</span>
            <button onClick={() => setUrl('http://paypal-login.tk')} className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm border border-red-500/20 hover:bg-red-500/20 transition-colors">High Risk</button>
            <button onClick={() => setUrl('https://github.com')} className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm border border-green-500/20 hover:bg-green-500/20 transition-colors">Safe</button>
            <button onClick={() => setUrl('http://secure-login-portal.net')} className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm border border-amber-500/20 hover:bg-amber-500/20 transition-colors">Suspicious</button>
          </div>
        </div>

        {/* Results Dashboard */}
        {currentResult && (
          <div className="animate-fade-in-up">

            {/* Top Stats Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8`}>
              {/* Prediction Status */}
              <div className={`p-6 rounded-2xl border ${currentResult.prediction.toLowerCase() === 'phishing' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-300">Analysis Result</h3>
                  {currentResult.prediction.toLowerCase() === 'phishing' ? (
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  )}
                </div>
                <p className={`text-3xl font-bold ${currentResult.prediction.toLowerCase() === 'phishing' ? 'text-red-400' : 'text-green-400'}`}>
                  {currentResult.prediction}
                </p>
                <p className="text-slate-400 mt-1">Based on ML analysis</p>
              </div>

              {/* Risk Score */}
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-300 mb-4">Risk Probability</h3>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-600 bg-sky-200">
                        Confidence
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-sky-400">
                        {(currentResult.riskScore || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-700">
                    <div style={{ width: `${currentResult.riskScore || 0}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${currentResult.riskScore > 50 ? 'bg-red-500' : 'bg-sky-500'} transition-all duration-1000 ease-out`}></div>
                  </div>
                </div>
                <p className="text-slate-400">Likelihood of being malicious</p>
              </div>

              {/* URL Info */}
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 break-words">
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Target</h3>
                <p className="text-sky-400 font-mono text-sm">{currentResult.url}</p>
              </div>
            </div>

            {/* SHAP Chart & Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* SHAP Chart */}
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Explainable AI Analysis</h3>
                {chartData ? (
                  <Bar options={chartOptions} data={chartData} />
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    No explanation data available
                  </div>
                )}
              </div>

              {/* Feature Table */}
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Key Features Detected</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 border-b border-slate-700 text-slate-400">Feature</th>
                        <th className="p-3 border-b border-slate-700 text-slate-400">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {currentResult.features && Object.entries(currentResult.features).map(([key, value]: [string, any]) => (
                        <tr key={key} className="hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 text-slate-300">{key}</td>
                          <td className="p-3 font-mono text-sky-400">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}