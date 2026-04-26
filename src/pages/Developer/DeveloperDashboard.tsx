import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Code2, Eye, Settings } from 'lucide-react';
import ApiKeyCard from '../../components/API/ApiKeyCard';
import CreateApiKeyModal, { CreateApiKeyData } from '../../components/API/CreateApiKeyModal';
import ApiKeyDisplay from '../../components/API/ApiKeyDisplay';
import ApiUsageChart from '../../components/API/ApiUsageChart';
import ApiLogTable from '../../components/API/ApiLogTable';

interface ApiKey {
  id: string;
  keyDisplay: string;
  name: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

interface ApiLog {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  createdAt: string;
}

const DeveloperDashboard: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<{
    key: string;
    id: string;
    keyDisplay: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'keys' | 'logs' | 'docs'>('overview');

  // Load API keys and logs on mount
  useEffect(() => {
    document.title = 'Developer | FeedSolve';
  }, []);

  useEffect(() => {
    loadApiKeys();
    loadApiLogs();
  }, []);

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the API
      setApiKeys([]);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiLogs = async () => {
    setLogsLoading(true);
    try {
      // In a real implementation, this would call the API
      setApiLogs([]);
    } catch (error) {
      console.error('Failed to load API logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCreateApiKey = async (data: CreateApiKeyData) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the API
      const mockResponse = {
        id: 'key_' + Math.random().toString(36).substr(2, 9),
        key: 'fsk_' + Math.random().toString(36).substr(2, 32),
        keyDisplay: 'fsk_...' + Math.random().toString(36).substr(2, 4),
        name: data.name,
      };

      setCreatedKey(mockResponse);
      setIsModalOpen(false);

      // Add to list after a short delay
      setTimeout(() => {
        setApiKeys((prev) => [
          ...prev,
          {
            id: mockResponse.id,
            keyDisplay: mockResponse.keyDisplay,
            name: data.name,
            permissions: data.permissions,
            createdAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return;

    try {
      // In a real implementation, this would call the API
      setApiKeys((prev) => prev.filter((key) => key.id !== id));
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleCopyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Code2 size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Developer Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Manage API keys, monitor usage, and integrate FeedSolve with your applications.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'keys', label: 'API Keys', icon: Settings },
            { id: 'logs', label: 'Logs', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                  selectedTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            <ApiUsageChart
              requestsThisMonth={1234}
              requestsLimit={10000}
              remainingRequests={8766}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Start</h3>
                <ol className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      1
                    </span>
                    <span>Create an API key in the "API Keys" tab</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      2
                    </span>
                    <span>Copy your key and store it securely</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      3
                    </span>
                    <span>Use it in your API requests</span>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Documentation</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="/api/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      → API Reference
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      → Integration Guide
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      → Code Examples
                    </a>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Need help? Contact our developer support team.
                </p>
                <a
                  href="mailto:support@feedsolve.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  Email Support
                </a>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'keys' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
                <p className="text-gray-600 text-sm mt-1">Manage your API keys and permissions</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Create New Key
              </button>
            </div>

            {apiKeys.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Code2 size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Keys Yet</h3>
                <p className="text-gray-600 mb-6">Create your first API key to get started</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create API Key
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apiKeys.map((key) => (
                  <ApiKeyCard
                    key={key.id}
                    apiKey={key}
                    onDelete={handleDeleteApiKey}
                    onCopy={handleCopyKey}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'logs' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">API Logs</h2>
              <p className="text-gray-600 text-sm mt-1">Monitor your API usage and requests</p>
            </div>

            <ApiLogTable logs={apiLogs} isLoading={logsLoading} />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateApiKey}
        isLoading={isLoading}
      />

      {createdKey && (
        <ApiKeyDisplay
          apiKey={createdKey.key}
          keyId={createdKey.id}
          keyDisplay={createdKey.keyDisplay}
          name={createdKey.name}
          onClose={() => setCreatedKey(null)}
        />
      )}
    </div>
  );
};

export default DeveloperDashboard;
