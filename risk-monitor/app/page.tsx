'use client';

import { useState, useEffect } from 'react';
import { configService } from '@/lib/configService';
import { Config, Report } from '@/lib/types';
import {
  Bell,
  Settings,
  Play,
  Database,
  AlertTriangle,
  TrendingUp,
  Globe,
  Tag,
  Building2,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';

export default function Home() {
  const [config, setConfig] = useState<Config>(configService.getConfig());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'keywords' | 'industries' | 'alerts' | 'admin'>('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [lastReport, setLastReport] = useState<Report | null>(null);
  const [scanMessage, setScanMessage] = useState('');

  useEffect(() => {
    const savedConfig = configService.getConfig();
    setConfig(savedConfig);
  }, []);

  const saveConfig = () => {
    configService.saveConfig(config);
    setScanMessage('Configuration saved successfully!');
    setTimeout(() => setScanMessage(''), 3000);
  };

  const runScan = async () => {
    setIsScanning(true);
    setScanMessage('Scanning news sources...');

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sources: config.sources.filter(s => s.enabled),
          keywords: config.keywords.filter(k => k.enabled),
          industries: config.industries.filter(i => i.enabled),
          alertConfig: config.alertConfig,
          reportType: 'realtime'
        })
      });

      const result = await response.json();

      if (result.success) {
        setLastReport(result.report);
        setScanMessage(
          `Scan completed! Found ${result.report.articles.length} risk alerts.`
        );
      } else {
        setScanMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setScanMessage(`Error: ${(error as Error).message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Risk Monitor AI
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time Business Risk Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={runScan}
              disabled={isScanning}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Run Scan Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Status Message */}
      {scanMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center space-x-3">
            <Bell className="h-5 w-5 text-indigo-600" />
            <span className="text-indigo-800">{scanMessage}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex space-x-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'sources', label: 'Sources', icon: Globe },
            { id: 'keywords', label: 'Keywords', icon: Tag },
            { id: 'industries', label: 'Industries', icon: Building2 },
            { id: 'alerts', label: 'Alerts', icon: Bell },
            { id: 'admin', label: 'Admin', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-12">
        {activeTab === 'dashboard' && (
          <DashboardTab lastReport={lastReport} />
        )}

        {activeTab === 'sources' && (
          <SourcesTab config={config} setConfig={setConfig} saveConfig={saveConfig} />
        )}

        {activeTab === 'keywords' && (
          <KeywordsTab config={config} setConfig={setConfig} saveConfig={saveConfig} />
        )}

        {activeTab === 'industries' && (
          <IndustriesTab config={config} setConfig={setConfig} saveConfig={saveConfig} />
        )}

        {activeTab === 'alerts' && (
          <AlertsTab config={config} setConfig={setConfig} saveConfig={saveConfig} />
        )}

        {activeTab === 'admin' && (
          <AdminTab />
        )}
      </div>
    </div>
  );
}

function DashboardTab({ lastReport }: { lastReport: Report | null }) {
  if (!lastReport) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
        <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Reports Yet
        </h3>
        <p className="text-gray-500">
          Click "Run Scan Now" to generate your first risk report
        </p>
      </div>
    );
  }

  const criticalCount = lastReport.articles.filter(a => a.severity === 'critical').length;
  const highCount = lastReport.articles.filter(a => a.severity === 'high').length;
  const mediumCount = lastReport.articles.filter(a => a.severity === 'medium').length;
  const lowCount = lastReport.articles.filter(a => a.severity === 'low').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical', count: criticalCount, color: 'red', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
          { label: 'High', count: highCount, color: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
          { label: 'Medium', count: mediumCount, color: 'yellow', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
          { label: 'Low', count: lowCount, color: 'green', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' }
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-lg p-6`}>
            <div className={`text-3xl font-bold ${stat.text}`}>{stat.count}</div>
            <div className="text-sm font-medium text-gray-600 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Executive Summary</h3>
        <p className="text-gray-700 whitespace-pre-line">{lastReport.summary}</p>
        <div className="mt-4 text-sm text-gray-500">
          Generated: {new Date(lastReport.generatedAt).toLocaleString()}
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Risk Alerts ({lastReport.articles.length})
        </h3>
        {lastReport.articles.map(article => (
          <div
            key={article.id}
            className={`bg-white rounded-lg shadow-md border-l-4 p-6 ${
              article.severity === 'critical'
                ? 'border-red-500'
                : article.severity === 'high'
                ? 'border-orange-500'
                : article.severity === 'medium'
                ? 'border-yellow-500'
                : 'border-green-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-800 flex-1">
                {article.title}
              </h4>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  article.severity === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : article.severity === 'high'
                    ? 'bg-orange-100 text-orange-700'
                    : article.severity === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {article.severity.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-3">
              {article.source} • {new Date(article.publishedAt).toLocaleDateString()} • Risk: {article.riskRank}/100
            </div>
            <div className="mb-3">
              <strong className="text-gray-700">Impact:</strong>{' '}
              <span className="text-gray-600">{article.impact}</span>
            </div>
            <div className="mb-3">
              <strong className="text-gray-700">Analysis:</strong>{' '}
              <span className="text-gray-600">{article.analysis}</span>
            </div>
            <div className="mb-3">
              <strong className="text-gray-700">Keywords:</strong>{' '}
              <span className="text-gray-600">{article.keywords.join(', ')}</span>
            </div>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              Read Full Article →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcesTab({
  config,
  setConfig,
  saveConfig
}: {
  config: Config;
  setConfig: (c: Config) => void;
  saveConfig: () => void;
}) {
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'rss' as const });

  const addSource = () => {
    if (!newSource.name || !newSource.url) return;

    setConfig({
      ...config,
      sources: [
        ...config.sources,
        {
          id: Date.now().toString(),
          ...newSource,
          enabled: true
        }
      ]
    });
    setNewSource({ name: '', url: '', type: 'rss' });
  };

  const toggleSource = (id: string) => {
    setConfig({
      ...config,
      sources: config.sources.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    });
  };

  const deleteSource = (id: string) => {
    setConfig({
      ...config,
      sources: config.sources.filter(s => s.id !== id)
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">News Sources</h2>
        <button
          onClick={saveConfig}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Add new source */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Add New Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Source Name"
            value={newSource.name}
            onChange={e => setNewSource({ ...newSource, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="url"
            placeholder="URL or RSS Feed"
            value={newSource.url}
            onChange={e => setNewSource({ ...newSource, url: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={addSource}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Source</span>
          </button>
        </div>
      </div>

      {/* Sources list */}
      <div className="space-y-3">
        {config.sources.map(source => (
          <div
            key={source.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <input
                type="checkbox"
                checked={source.enabled}
                onChange={() => toggleSource(source.id)}
                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">{source.name}</div>
                <div className="text-sm text-gray-500">{source.url}</div>
              </div>
            </div>
            <button
              onClick={() => deleteSource(source.id)}
              className="text-red-600 hover:text-red-800 p-2"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeywordsTab({
  config,
  setConfig,
  saveConfig
}: {
  config: Config;
  setConfig: (c: Config) => void;
  saveConfig: () => void;
}) {
  const [newKeyword, setNewKeyword] = useState({
    term: '',
    category: 'other' as const
  });

  const addKeyword = () => {
    if (!newKeyword.term) return;

    setConfig({
      ...config,
      keywords: [
        ...config.keywords,
        {
          id: Date.now().toString(),
          ...newKeyword,
          enabled: true
        }
      ]
    });
    setNewKeyword({ term: '', category: 'other' });
  };

  const toggleKeyword = (id: string) => {
    setConfig({
      ...config,
      keywords: config.keywords.map(k =>
        k.id === id ? { ...k, enabled: !k.enabled } : k
      )
    });
  };

  const deleteKeyword = (id: string) => {
    setConfig({
      ...config,
      keywords: config.keywords.filter(k => k.id !== id)
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Risk Keywords</h2>
        <button
          onClick={saveConfig}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Add new keyword */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Add New Keyword</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Keyword term"
            value={newKeyword.term}
            onChange={e => setNewKeyword({ ...newKeyword, term: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            value={newKeyword.category}
            onChange={e =>
              setNewKeyword({ ...newKeyword, category: e.target.value as any })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="geopolitical">Geopolitical</option>
            <option value="economic">Economic</option>
            <option value="regulatory">Regulatory</option>
            <option value="technological">Technological</option>
            <option value="environmental">Environmental</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={addKeyword}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Keyword</span>
          </button>
        </div>
      </div>

      {/* Keywords list */}
      <div className="space-y-3">
        {config.keywords.map(keyword => (
          <div
            key={keyword.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <input
                type="checkbox"
                checked={keyword.enabled}
                onChange={() => toggleKeyword(keyword.id)}
                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">{keyword.term}</div>
                <div className="text-sm text-gray-500 capitalize">
                  {keyword.category}
                </div>
              </div>
            </div>
            <button
              onClick={() => deleteKeyword(keyword.id)}
              className="text-red-600 hover:text-red-800 p-2"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndustriesTab({
  config,
  setConfig,
  saveConfig
}: {
  config: Config;
  setConfig: (c: Config) => void;
  saveConfig: () => void;
}) {
  const [newIndustry, setNewIndustry] = useState('');

  const addIndustry = () => {
    if (!newIndustry) return;

    setConfig({
      ...config,
      industries: [
        ...config.industries,
        {
          id: Date.now().toString(),
          name: newIndustry,
          enabled: true
        }
      ]
    });
    setNewIndustry('');
  };

  const toggleIndustry = (id: string) => {
    setConfig({
      ...config,
      industries: config.industries.map(i =>
        i.id === id ? { ...i, enabled: !i.enabled } : i
      )
    });
  };

  const deleteIndustry = (id: string) => {
    setConfig({
      ...config,
      industries: config.industries.filter(i => i.id !== id)
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Industries</h2>
        <button
          onClick={saveConfig}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Add new industry */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Add New Industry</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Industry name"
            value={newIndustry}
            onChange={e => setNewIndustry(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={addIndustry}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Industry</span>
          </button>
        </div>
      </div>

      {/* Industries list */}
      <div className="space-y-3">
        {config.industries.map(industry => (
          <div
            key={industry.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <input
                type="checkbox"
                checked={industry.enabled}
                onChange={() => toggleIndustry(industry.id)}
                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div className="font-medium text-gray-800">{industry.name}</div>
            </div>
            <button
              onClick={() => deleteIndustry(industry.id)}
              className="text-red-600 hover:text-red-800 p-2"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsTab({
  config,
  setConfig,
  saveConfig
}: {
  config: Config;
  setConfig: (c: Config) => void;
  saveConfig: () => void;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [newWhatsApp, setNewWhatsApp] = useState('');

  const addEmail = () => {
    if (!newEmail) return;
    setConfig({
      ...config,
      alertConfig: {
        ...config.alertConfig,
        email: [...config.alertConfig.email, newEmail]
      }
    });
    setNewEmail('');
  };

  const addWhatsApp = () => {
    if (!newWhatsApp) return;
    setConfig({
      ...config,
      alertConfig: {
        ...config.alertConfig,
        whatsapp: [...config.alertConfig.whatsapp, newWhatsApp]
      }
    });
    setNewWhatsApp('');
  };

  const removeEmail = (email: string) => {
    setConfig({
      ...config,
      alertConfig: {
        ...config.alertConfig,
        email: config.alertConfig.email.filter(e => e !== email)
      }
    });
  };

  const removeWhatsApp = (phone: string) => {
    setConfig({
      ...config,
      alertConfig: {
        ...config.alertConfig,
        whatsapp: config.alertConfig.whatsapp.filter(p => p !== phone)
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Alert Configuration</h2>
        <button
          onClick={saveConfig}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Email Alerts */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Mail className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Email Alerts</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={addEmail}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {config.alertConfig.email.map(email => (
              <div
                key={email}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <span className="text-gray-700">{email}</span>
                <button
                  onClick={() => removeEmail(email)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Alerts */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">WhatsApp Alerts</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex gap-3">
              <input
                type="tel"
                placeholder="+1234567890"
                value={newWhatsApp}
                onChange={e => setNewWhatsApp(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={addWhatsApp}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {config.alertConfig.whatsapp.map(phone => (
              <div
                key={phone}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <span className="text-gray-700">{phone}</span>
                <button
                  onClick={() => removeWhatsApp(phone)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Types */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Report Types</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.alertConfig.realTimeEnabled}
                onChange={e =>
                  setConfig({
                    ...config,
                    alertConfig: {
                      ...config.alertConfig,
                      realTimeEnabled: e.target.checked
                    }
                  })
                }
                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">Real-time Alerts</div>
                <div className="text-sm text-gray-500">
                  Immediate notifications for critical risks (Email + WhatsApp)
                </div>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.alertConfig.dailyEnabled}
                onChange={e =>
                  setConfig({
                    ...config,
                    alertConfig: {
                      ...config.alertConfig,
                      dailyEnabled: e.target.checked
                    }
                  })
                }
                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">Daily Reports</div>
                <div className="text-sm text-gray-500">
                  Daily summary reports (Email + WhatsApp)
                </div>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.alertConfig.weeklyEnabled}
                onChange={e =>
                  setConfig({
                    ...config,
                    alertConfig: {
                      ...config.alertConfig,
                      weeklyEnabled: e.target.checked
                    }
                  })
                }
                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">Weekly Reports</div>
                <div className="text-sm text-gray-500">
                  Comprehensive weekly analysis (Email only)
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminTab() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Control Panel</h2>

      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-800 mb-4">Setup Instructions</h3>
          <div className="space-y-3 text-sm text-indigo-700">
            <div>
              <strong>1. Environment Variables:</strong> Configure your{' '}
              <code className="bg-white px-2 py-1 rounded">.env.local</code> file
              with:
            </div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>OPENAI_API_KEY - Get from OpenAI</li>
              <li>NEWS_API_KEY - Get from newsapi.org</li>
              <li>GOOGLE_CLIENT_EMAIL & GOOGLE_PRIVATE_KEY - Google Service Account</li>
              <li>GOOGLE_SHEET_ID - Your Google Sheet ID</li>
              <li>SMTP credentials - For email notifications</li>
              <li>WhatsApp Business API credentials</li>
              <li>CRON_SECRET - Random secret for securing cron endpoints</li>
            </ul>

            <div className="mt-4">
              <strong>2. Automated Scans:</strong> Set up cron jobs to call:
            </div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                Daily: <code className="bg-white px-2 py-1 rounded">GET /api/cron/daily</code>
              </li>
              <li>
                Weekly: <code className="bg-white px-2 py-1 rounded">GET /api/cron/weekly</code>
              </li>
              <li>Include header: <code className="bg-white px-2 py-1 rounded">Authorization: Bearer [CRON_SECRET]</code></li>
            </ul>

            <div className="mt-4">
              <strong>3. Google Sheets Setup:</strong>
            </div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Create a Google Cloud Project</li>
              <li>Enable Google Sheets API</li>
              <li>Create a Service Account and download credentials</li>
              <li>Create a Google Sheet and share it with the service account email</li>
            </ul>

            <div className="mt-4">
              <strong>4. WhatsApp Business API:</strong>
            </div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Set up a Meta Business Account</li>
              <li>Configure WhatsApp Business API</li>
              <li>Get your Phone Number ID and Access Token</li>
            </ul>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-800 mb-2">System Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700">✓ Frontend:</span> Running
            </div>
            <div>
              <span className="text-green-700">✓ API:</span> Ready
            </div>
            <div>
              <span className="text-green-700">✓ Configuration:</span> Loaded
            </div>
            <div>
              <span className="text-green-700">✓ Storage:</span> LocalStorage
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Configure all environment variables before running scans</li>
            <li>Test email/WhatsApp integration before enabling automated reports</li>
            <li>Monitor API usage and costs (OpenAI, NewsAPI)</li>
            <li>Review and adjust keywords regularly for better accuracy</li>
            <li>Google Sheets provides permanent backup of all reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
