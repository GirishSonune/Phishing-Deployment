import React, { useState } from 'react';
import Navbar from '../components/Navbar';

import { MagnifyingGlassIcon, FunnelIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // fetch('http://localhost:5000/api/history')
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    fetch(`${baseUrl}/api/history`)
      .then(res => res.json())
      .then(data => {
        setHistoryData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch history:", err);
        setIsLoading(false);
      });
  }, []);

  const filteredAndSortedData = historyData
    .filter(check => {
      const matchesSearch = check.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' ||
        (filterBy === 'blocked' && check.actionTaken === 'blocked') ||
        (filterBy === 'allowed' && check.actionTaken === 'allowed') ||
        (filterBy === 'suspicious' && check.riskScore > 50 && check.actionTaken === 'allowed');
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'risk':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        case 'url':
          aValue = a.url.toLowerCase();
          bValue = b.url.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const stats = {
    total: historyData.length,
    blocked: historyData.filter(c => c.actionTaken === 'blocked').length,
    suspicious: historyData.filter(c => c.riskScore > 50 && c.actionTaken === 'allowed').length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full">High Risk</span>;
    } else if (score >= 30) {
      return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 rounded-full">Medium Risk</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">Low Risk</span>;
    }
  };

  const getActionBadge = (action: string) => {
    if (action === 'blocked') {
      return <span className="flex items-center text-red-600 dark:text-red-400"><span className="mr-1">🚫</span> Blocked</span>;
    } else {
      return <span className="flex items-center text-green-600 dark:text-green-400"><span className="mr-1">✅</span> Allowed</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar variant="app" />

      <div className="max-w-7xl mx-auto pt-8 pb-12 px-4">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Websites Checked</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.blocked}</p>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.suspicious}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Block History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Block History</h2>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search URLs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Sites</option>
                  <option value="blocked">Blocked Only</option>
                  <option value="allowed">Allowed Only</option>
                  <option value="suspicious">Suspicious Only</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="risk-desc">Risk (Highest)</option>
                  <option value="risk-asc">Risk (Lowest)</option>
                  <option value="url-asc">URL (A-Z)</option>
                  <option value="url-desc">URL (Z-A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    URL Checked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Risk Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action Taken
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedData.map((check) => (
                  <tr key={check.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(check.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                      <div className="truncate" title={check.url}>
                        {check.url}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${check.riskScore >= 70 ? 'text-red-600' :
                          check.riskScore >= 30 ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                          {check.riskScore}%
                        </span>
                        {getRiskBadge(check.riskScore)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                      {check.riskReasons.length > 0 ? (
                        <div className="truncate" title={check.riskReasons.join(', ')}>
                          {check.riskReasons.join(', ')}
                        </div>
                      ) : (
                        'None'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getActionBadge(check.actionTaken)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedData.length === 0 && (
            <div className="text-center py-12">
              <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No results found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}