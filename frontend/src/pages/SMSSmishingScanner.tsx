import React, { useState } from 'react';
import {
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  ShieldAlert,
  Zap
} from 'lucide-react';

interface SMSSmishingScannerProps {
  onBack: () => void;
}

const SMSSmishingScanner: React.FC<SMSSmishingScannerProps> = ({ onBack }) => {
  const [message, setMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyzeSMS = async () => {
    if (!message.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const baseUrl = import.meta.env.VITE_SMISHING_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction');
      }

      const data = await response.json();

      // Map API response to UI expected format
      // API returns: { original_message, prediction, confidence, riskScore }
      // UI expects: { prediction, confidence, threats }

      const isSmishing = data.prediction === 'Smishing';

      setResult({
        prediction: data.prediction,
        confidence: (data.confidence * 100).toFixed(1), // Assuming API returns 0.0-1.0 or similar, adjust if needed
        threats: isSmishing ? [
          'High probability of social engineering',
          'Content matches known smishing patterns',
          `Risk Score: ${data.riskScore?.toFixed(2) || 'N/A'}`
        ] : ['No significant threats detected']
      });

    } catch (error: any) {
      console.error("Error analyzing SMS:", error);
      alert(`Failed to analyze the message. ${error.message || "Please ensure the Smishing backend server is running on port 5001."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white mb-8 group">
        <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Intelligence Center
      </button>

      <div className="text-center mb-12">
        <div className="inline-block p-4 rounded-3xl bg-purple-500/10 mb-6 border border-purple-500/20">
          <MessageSquare className="h-12 w-12 text-purple-500 mx-auto" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 text-center">SMS Smishing Detector</h1>
        <p className="text-slate-400 max-w-xl mx-auto text-center">Utilize advanced Natural Language Processing to detect social engineering attempts in text messages.</p>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-700/50 p-8 mb-10 shadow-2xl">
        <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Message Content</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Paste the suspicious text message here..."
          rows={5}
          className="w-full p-5 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-500 outline-none transition-all resize-none font-medium"
        />
        <button
          onClick={analyzeSMS}
          disabled={!message.trim() || isAnalyzing}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20"
        >
          {isAnalyzing ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <><Zap className="h-6 w-6" /> Run Intelligence Scan</>}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
          <div className={`p-10 rounded-3xl border-2 flex flex-col items-center text-center ${result.prediction === 'Smishing' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
            <div className={`p-4 rounded-2xl mb-6 ${result.prediction === 'Smishing' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              <ShieldAlert className={`h-12 w-12 ${result.prediction === 'Smishing' ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <h3 className="text-slate-500 text-xs uppercase font-black tracking-widest mb-2">NLP Verdict</h3>
            <div className={`text-5xl font-black ${result.prediction === 'Smishing' ? 'text-red-500' : 'text-green-500'}`}>
              {result.prediction.toUpperCase()}
            </div>
            <div className="mt-6 px-4 py-1.5 bg-slate-900/80 rounded-full border border-slate-700 text-xs font-bold text-slate-400">
              Confidence: {result.confidence}%
            </div>
          </div>

          <div className="p-10 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" /> Risk Identifiers
            </h3>
            <div className="space-y-4">
              {result.threats.map((threat: string, idx: number) => (
                <div key={idx} className="flex items-start gap-4 text-slate-300 bg-slate-900/30 p-4 rounded-2xl border border-slate-800">
                  <div className="h-2 w-2 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                  <span className="text-sm font-medium">{threat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSSmishingScanner;