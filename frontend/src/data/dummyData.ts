export interface URLCheck {
  id: string;
  date: string;
  url: string;
  riskScore: number;
  riskReasons: string[];
  actionTaken: 'blocked' | 'allowed';
}

export const dummyURLChecks: URLCheck[] = [
  {
    id: '1',
    date: '2025-01-26',
    url: 'http://paypal-login.tk',
    riskScore: 92,
    riskReasons: ['Domain < 7 days old', 'Contains keyword "secure-login"', 'SSL invalid', 'Suspicious domain extension'],
    actionTaken: 'blocked'
  },
  {
    id: '2',
    date: '2025-01-26',
    url: 'https://example.com',
    riskScore: 15,
    riskReasons: [],
    actionTaken: 'allowed'
  },
  {
    id: '3',
    date: '2025-01-25',
    url: 'http://microsoft-security-alert.net',
    riskScore: 88,
    riskReasons: ['Fake company name', 'Suspicious subdomain', 'No HTTPS'],
    actionTaken: 'blocked'
  },
  {
    id: '4',
    date: '2025-01-25',
    url: 'https://github.com',
    riskScore: 8,
    riskReasons: [],
    actionTaken: 'allowed'
  },
  {
    id: '5',
    date: '2025-01-24',
    url: 'http://amazon-verification.xyz',
    riskScore: 95,
    riskReasons: ['Domain < 3 days old', 'Contains "verification"', 'Suspicious TLD', 'No SSL certificate'],
    actionTaken: 'blocked'
  },
  {
    id: '6',
    date: '2025-01-24',
    url: 'https://stackoverflow.com',
    riskScore: 12,
    riskReasons: [],
    actionTaken: 'allowed'
  },
  {
    id: '7',
    date: '2025-01-23',
    url: 'http://bank-security-update.tk',
    riskScore: 89,
    riskReasons: ['Contains "bank"', 'Suspicious domain', 'No HTTPS', 'Short domain age'],
    actionTaken: 'blocked'
  },
  {
    id: '8',
    date: '2025-01-23',
    url: 'https://google.com',
    riskScore: 5,
    riskReasons: [],
    actionTaken: 'allowed'
  },
  {
    id: '9',
    date: '2025-01-22',
    url: 'http://secure-login-portal.net',
    riskScore: 76,
    riskReasons: ['Contains "secure-login"', 'Generic domain name', 'No SSL'],
    actionTaken: 'allowed'
  },
  {
    id: '10',
    date: '2025-01-22',
    url: 'https://wikipedia.org',
    riskScore: 3,
    riskReasons: [],
    actionTaken: 'allowed'
  },
  {
    id: '11',
    date: '2025-01-21',
    url: 'http://apple-id-locked.com',
    riskScore: 94,
    riskReasons: ['Fake company reference', 'Contains "locked"', 'Suspicious domain', 'No HTTPS'],
    actionTaken: 'blocked'
  },
  {
    id: '12',
    date: '2025-01-21',
    url: 'https://netflix.com',
    riskScore: 10,
    riskReasons: [],
    actionTaken: 'allowed'
  }
];

export const getAnalyticsData = () => {
  const totalChecked = dummyURLChecks.length;
  const blocked = dummyURLChecks.filter(check => check.actionTaken === 'blocked').length;
  const allowed = dummyURLChecks.filter(check => check.actionTaken === 'allowed').length;
  const suspicious = dummyURLChecks.filter(check => check.riskScore > 50 && check.actionTaken === 'allowed').length;
  const safe = allowed - suspicious;

  return {
    totalChecked,
    blocked,
    suspicious,
    safe,
    pieData: {
      labels: ['Safe', 'Phishing', 'Suspicious'],
      datasets: [{
        data: [safe, blocked, suspicious],
        backgroundColor: ['#16A34A', '#DC2626', '#FBBF24'],
        borderColor: ['#15803D', '#B91C1C', '#F59E0B'],
        borderWidth: 2
      }]
    },
    dailyData: {
      labels: ['21 Jan', '22 Jan', '23 Jan', '24 Jan', '25 Jan', '26 Jan'],
      datasets: [{
        label: 'Phishing Sites Detected',
        data: [1, 0, 1, 1, 1, 1],
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    riskLevelData: {
      labels: ['Low Risk (0-30)', 'Medium Risk (31-70)', 'High Risk (71-100)'],
      datasets: [{
        label: 'Number of URLs',
        data: [6, 1, 5],
        backgroundColor: ['#16A34A', '#FBBF24', '#DC2626'],
        borderColor: ['#15803D', '#F59E0B', '#B91C1C'],
        borderWidth: 2
      }]
    }
  };
};