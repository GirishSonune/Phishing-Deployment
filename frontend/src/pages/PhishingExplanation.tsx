import React from 'react';
import { 
  ShieldExclamationIcon, 
  LightBulbIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

interface PhishingExplanationProps {
  features: Record<string, any>;
  shapValues?: Record<string, number>;
}

const PhishingExplanation: React.FC<PhishingExplanationProps> = ({ features, shapValues }) => {
  // Mapping technical terms to non-technical explanations
  const riskDictionary: Record<string, string> = {
    "HTTPS_token": "The link puts 'https' inside the domain name to trick you into feeling safe.",
    "Prefix_Suffix": "A dash (-) was found in the domain. Scammers use this to mimic real brands like 'brand-login.com'.",
    "Shortining_Service": "The link is hidden behind a shortening service (like bit.ly) to hide its real destination.",
    "URL_Length": "The link is unusually long and complex, a tactic used to hide malicious code.",
    "double_slash_redirecting": "The link contains a '//' redirect symbol which can secretly send you to a different site.",
    "having_At_Symbol": "The '@' symbol is used to ignore the first part of the link and hide the real scam site.",
    "having_IP_Address": "This link uses a raw number (IP address) instead of a name. Legitimate companies don't do this.",
    "having_Sub_Domain": "The address has too many sections (dots), used to create fake 'trusted' structures.",
    "SSLfinal_State": "The website lacks a valid security certificate or uses an untrusted one.",
    "Domain_registeration_length": "This website was created very recently, which is common for temporary scam pages.",
    "web_traffic": "This site has virtually no visitors, suggesting it is not a well-known or reputable business."
  };

  // Identify the most critical risk factors
  const getRiskFactors = () => {
    // We look for features that are set to 1 (phishing indicator) 
    // or have positive SHAP values (risk contribution)
    return Object.entries(features)
      .filter(([key, value]) => {
        const shapImpact = shapValues ? shapValues[key] || 0 : 0;
        return Number(value) === 1 || shapImpact > 0;
      })
      .map(([key]) => ({
        id: key,
        label: key.replace(/_/g, ' '),
        description: riskDictionary[key] || `This specific technical structure is typical of phishing links.`
      }))
      .slice(0, 4); // Show top 4 reasons for readability
  };

  const factors = getRiskFactors();

  if (factors.length === 0) return null;

  return (
    <div className="mt-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/20 rounded-2xl">
            <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Why was this flagged?</h2>
            <p className="text-slate-400">Our AI identified specific markers used in phishing attacks.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {factors.map((factor) => (
            <div key={factor.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex gap-4 transition-hover hover:border-red-500/30 duration-300">
              <div className="mt-1">
                <ExclamationCircleIcon className="h-6 w-6 text-red-400 shrink-0" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 uppercase text-xs tracking-widest mb-2">
                  {factor.label}
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {factor.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-4 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
          <LightBulbIcon className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
          <div>
            <h5 className="text-amber-500 font-bold text-sm uppercase tracking-wider mb-1">Safety Recommendation</h5>
            <p className="text-slate-300 text-sm">
              We strongly advise against entering any passwords, credit card numbers, or personal details on this site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhishingExplanation;