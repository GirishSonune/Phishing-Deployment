import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface RiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  riskScore: number;
  riskReasons: string[];
  onBlock: () => void;
  onContinue: () => void;
}

export default function RiskModal({
  isOpen,
  onClose,
  url,
  riskScore,
  riskReasons,
  onBlock,
  onContinue
}: RiskModalProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const getRiskLevel = () => {
    if (riskScore >= 70) return { level: 'High Risk', color: 'text-red-600', icon: ExclamationTriangleIcon, bgColor: 'bg-red-50 dark:bg-red-900/20' };
    if (riskScore >= 30) return { level: 'Suspicious', color: 'text-amber-600', icon: ShieldExclamationIcon, bgColor: 'bg-amber-50 dark:bg-amber-900/20' };
    return { level: 'Safe', color: 'text-green-600', icon: CheckCircleIcon, bgColor: 'bg-green-50 dark:bg-green-900/20' };
  };

  const risk = getRiskLevel();
  const Icon = risk.icon;

  const handleContinue = () => {
    if (riskScore >= 70) {
      setShowConfirmation(true);
    } else {
      onContinue();
    }
  };

  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`${
              percentage >= 70 
                ? 'text-red-500' 
                : percentage >= 30 
                ? 'text-amber-500' 
                : 'text-green-500'
            } transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${risk.color}`}>
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative ${risk.bgColor} border-2 ${
          riskScore >= 70 
            ? 'border-red-200 dark:border-red-800' 
            : riskScore >= 30 
            ? 'border-amber-200 dark:border-amber-800' 
            : 'border-green-200 dark:border-green-800'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="text-center">
            <div className="mb-4">
              <Icon className={`h-12 w-12 mx-auto ${risk.color}`} />
            </div>

            <h3 className={`text-2xl font-bold ${risk.color} mb-2`}>
              {risk.level} Detected
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-4 break-all">
              {url}
            </p>

            <div className="mb-6">
              <CircularProgress percentage={riskScore} />
            </div>

            {riskReasons.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Risk Factors:
                </h4>
                <div className="space-y-2">
                  {riskReasons.map((reason, index) => (
                    <div key={index} className="flex items-center space-x-2 text-left">
                      <span className="text-red-500">❌</span>
                      <span className="text-gray-700 dark:text-gray-300">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {riskScore < 30 ? (
                <button
                  onClick={onContinue}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ Visit Site
                </button>
              ) : (
                <>
                  <button
                    onClick={onBlock}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    🔴 Block & Go Back
                  </button>
                  <button
                    onClick={handleContinue}
                    className="flex-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    ⚠️ Continue Anyway
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Are you sure?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This site is very likely phishing. Continuing could put your personal information at risk.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    onContinue();
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}