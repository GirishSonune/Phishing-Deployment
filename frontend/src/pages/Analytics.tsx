import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import { getAnalyticsData } from '../data/dummyData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const analyticsData = getAnalyticsData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#374151'
        }
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF',
        titleColor: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#111827',
        borderColor: document.documentElement.classList.contains('dark') ? '#6B7280' : '#E5E7EB',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#374151'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
        }
      },
      y: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#374151'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#374151',
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF',
        titleColor: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#111827',
        borderColor: document.documentElement.classList.contains('dark') ? '#6B7280' : '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} sites (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar variant="app" />
      
      <div className="max-w-7xl mx-auto pt-8 pb-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive insights into your browsing protection</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Websites Checked</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analyticsData.totalChecked}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <span className="text-2xl">🚫</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Websites Blocked</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analyticsData.blocked}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Suspicious but Continued</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analyticsData.suspicious}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Security Status Distribution
            </h3>
            <div className="h-80">
              <Pie data={analyticsData.pieData} options={pieOptions} />
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Daily Phishing Detection Trend
            </h3>
            <div className="h-80">
              <Line data={analyticsData.dailyData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Bar Chart - Full Width */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Risk Level Breakdown
          </h3>
          <div className="h-80">
            <Bar data={analyticsData.riskLevelData} options={chartOptions} />
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Key Insights
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-green-800 dark:text-green-200">Protection Rate</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {Math.round((analyticsData.blocked / analyticsData.totalChecked) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-blue-800 dark:text-blue-200">Safe Sites</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {analyticsData.safe} sites
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <span className="text-amber-800 dark:text-amber-200">Risk Assessment Accuracy</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">98.5%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-red-500">🚫</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">High-risk site blocked</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">paypal-login.tk - 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-green-500">✅</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Safe site accessed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">github.com - 3 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <span className="text-amber-500">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Suspicious site flagged</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">secure-login-portal.net - 5 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}