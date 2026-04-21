import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateApiKeyData) => Promise<void>;
  isLoading?: boolean;
}

export interface CreateApiKeyData {
  name: string;
  permissions: string[];
  expiresAt?: string;
  ipWhitelist?: string[];
}

const AVAILABLE_PERMISSIONS = [
  'submissions:read',
  'submissions:write',
  'submissions:delete',
  'boards:read',
  'boards:write',
  'boards:delete',
  'stats:read',
  'keys:create',
  'keys:read',
  'keys:delete',
  'company:read',
];

const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: '',
    permissions: [],
    expiresAt: '',
    ipWhitelist: [],
  });
  const [ipInput, setIpInput] = useState('');

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleAddIp = () => {
    if (ipInput.trim() && !formData.ipWhitelist?.includes(ipInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        ipWhitelist: [...(prev.ipWhitelist || []), ipInput.trim()],
      }));
      setIpInput('');
    }
  };

  const handleRemoveIp = (ip: string) => {
    setFormData((prev) => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist?.filter((i) => i !== ip),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.permissions.length > 0) {
      await onCreate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Create API Key</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Key Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Key Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Production Integration"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">A descriptive name for this API key</p>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Permissions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-mono text-gray-700">{permission}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Select at least one permission</p>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expiresAt || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
          </div>

          {/* IP Whitelist */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              IP Whitelist (Optional)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="e.g., 203.0.113.45"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIp();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddIp}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
              >
                Add IP
              </button>
            </div>
            {formData.ipWhitelist && formData.ipWhitelist.length > 0 && (
              <div className="space-y-2">
                {formData.ipWhitelist.map((ip) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm font-mono text-gray-700">{ip}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIp(ip)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Restrict API key to specific IP addresses
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!formData.name || formData.permissions.length === 0 || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateApiKeyModal;
