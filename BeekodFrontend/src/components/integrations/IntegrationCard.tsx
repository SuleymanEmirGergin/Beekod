/**
 * IntegrationCard Component
 * Reusable card for marketplace integration display
 */

import { Settings as SettingsIcon, Link2, RefreshCw } from 'lucide-react';
import { Card } from '../shared';

export interface IntegrationCardProps {
  id: string;
  name: string;
  description: string;
  logo?: string;
  logoText?: string;
  logoColor?: string;
  logoBgColor?: string;
  connected: boolean;
  lastSync?: string;
  itemsSynced?: number;
  isConnecting?: boolean;
  
  // Actions
  onConnect?: () => void;
  onConfigure?: () => void;
  onViewLogs?: () => void;
  
  // For connected cards with stats
  showStats?: boolean;
  
  // For disconnected cards with form
  children?: React.ReactNode;
}

export function IntegrationCard({
  name,
  description,
  logo,
  logoText,
  logoColor = 'text-orange-600',
  logoBgColor = 'bg-orange-50 border-orange-100',
  connected,
  lastSync,
  itemsSynced = 0,
  isConnecting = false,
  onConnect,
  onConfigure,
  onViewLogs,
  showStats = false,
  children,
}: IntegrationCardProps) {
  return (
    <Card padding="lg">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border ${logoBgColor}`}>
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-contain p-1" />
          ) : (
            <span className={`font-black italic ${logoColor}`}>{logoText}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base text-gray-900">{name}</h3>
            <ConnectionBadge connected={connected} />
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      {/* Stats (for connected cards) */}
      {showStats && connected && (
        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
          <div>
            <div className="text-xs text-gray-500 mb-1">Last Sync</div>
            <div className="text-sm text-gray-900">{lastSync || 'Never'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Products Synced</div>
            <div className="text-sm text-gray-900">{itemsSynced}</div>
          </div>
        </div>
      )}

      {/* Custom content (forms for disconnected) */}
      {children}

      {/* Actions */}
      {connected && showStats ? (
        <div className="flex gap-2">
          {onViewLogs && (
            <button
              onClick={onViewLogs}
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Log Settings
            </button>
          )}
          {onConfigure && (
            <button
              onClick={onConfigure}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              Configure
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors hover:bg-black disabled:opacity-50"
        >
          {isConnecting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          {connected ? 'Ayarları Düzenle' : 'Bağla'}
        </button>
      )}
    </Card>
  );
}

// Connection status badge
function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${connected ? 'bg-green-50' : 'bg-gray-50'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span className={connected ? 'text-green-700' : 'text-gray-600'}>
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

// Simplified card for e-commerce platforms
export function SimpleIntegrationCard({
  name,
  description,
  logoText,
  logoColor,
  logoBgColor,
  onConnect,
}: {
  name: string;
  description: string;
  logoText: string;
  logoColor: string;
  logoBgColor: string;
  onConnect?: () => void;
}) {
  return (
    <Card padding="lg">
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border italic font-black ${logoBgColor} ${logoColor}`}>
          {logoText}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base text-gray-900">{name}</h3>
            <ConnectionBadge connected={false} />
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onConnect}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors hover:bg-black"
      >
        Bağla
      </button>
    </Card>
  );
}
