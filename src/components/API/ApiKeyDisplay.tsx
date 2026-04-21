import React, { useState } from 'react';
import { Copy, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface ApiKeyDisplayProps {
  apiKey: string;
  keyId: string;
  keyDisplay: string;
  name: string;
  onClose: () => void;
}

const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({
  apiKey,
  keyId,
  keyDisplay,
  name,
  onClose,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="bg-green-50 border-b-2 border-green-200 p-6">
          <h2 className="text-xl font-bold text-green-900">API Key Created Successfully</h2>
          <p className="text-sm text-green-700 mt-1">Your new API key "{name}" has been created.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Save your API key now</p>
              <p>This key will only be displayed once. If you lose it, you'll need to create a new one.</p>
            </div>
          </div>

          {/* API Key Display */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              API Key
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 p-4 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm break-all">
                {showKey ? apiKey : '•'.repeat(apiKey.length)}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showKey ? 'Hide' : 'Show'} Key
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  <Copy size={16} />
                  {copied ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>
          </div>

          {/* Key ID for reference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Key ID (for reference)
            </label>
            <input
              type="text"
              value={keyId}
              readOnly
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm text-gray-600"
            />
          </div>

          {/* Display Key */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Key Display (use for reference in UI)
            </label>
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg font-mono text-sm text-blue-900">
              {keyDisplay}
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">How to use</h4>
            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
              {`curl -H "Authorization: Bearer ${apiKey}" \\
  https://api.feedsolve.com/api/company/submissions`}
            </pre>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            I've Saved My Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDisplay;
