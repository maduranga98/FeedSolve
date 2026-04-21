import React from 'react';
import { Copy, Trash2, Clock } from 'lucide-react';

interface ApiKey {
  id: string;
  keyDisplay: string;
  name: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onDelete: (id: string) => void;
  onCopy: (keyDisplay: string) => void;
}

const ApiKeyCard: React.FC<ApiKeyCardProps> = ({ apiKey, onDelete, onCopy }) => {
  const lastUsed = apiKey.lastUsedAt
    ? new Date(apiKey.lastUsedAt).toLocaleDateString()
    : 'Never';

  const expiresIn = apiKey.expiresAt
    ? new Date(apiKey.expiresAt).toLocaleDateString()
    : 'Never';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{apiKey.name}</h3>
          <p className="text-sm text-gray-500 font-mono mt-1">{apiKey.keyDisplay}</p>
        </div>
        <button
          onClick={() => onDelete(apiKey.id)}
          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
          title="Delete API key"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span>Last used: {lastUsed}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span>Expires: {expiresIn}</span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">PERMISSIONS</h4>
        <div className="flex flex-wrap gap-1">
          {apiKey.permissions.map((perm) => (
            <span
              key={perm}
              className="inline-flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
            >
              {perm}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => onCopy(apiKey.keyDisplay)}
        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg transition font-medium text-sm"
      >
        <Copy size={14} />
        Copy Key Display
      </button>
    </div>
  );
};

export default ApiKeyCard;
