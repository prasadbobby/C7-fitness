"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  useDisclosure,
  Divider
} from "@nextui-org/react";
import {
  IconDeviceMobile,
  IconDeviceWatch,
  IconBrandApple,
  IconBrandGoogle,
  IconSettings,
  IconCheck,
  IconX,
  IconRefresh,
  IconPlus,
  IconLogin
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";

interface DeviceConnection {
  type: 'GOOGLE_FIT';
  isConnected: boolean;
  deviceInfo?: {
    name: string;
    type: 'Android' | 'Wear OS' | 'Fitbit' | 'Other';
  };
  lastSyncAt?: string;
  syncEnabled: boolean;
}

interface DeviceHealthIntegrationProps {
  onSyncComplete?: () => void;
}

export default function DeviceHealthIntegration({ onSyncComplete }: DeviceHealthIntegrationProps) {
  const [connections, setConnections] = useState<DeviceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/fitness/connections');

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (type: string) => {
    setSyncing(type);
    try {
      const response = await fetch('/api/fitness/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        await fetchConnections();
        onSyncComplete?.();
      }
    } catch (error) {
      console.error(`Error syncing ${type}:`, error);
    } finally {
      setSyncing(null);
    }
  };

  const handleReconnect = async (type: string) => {
    setReconnecting(type);
    try {
      // Get the auth URL from the API
      const response = await fetch('/api/auth/google-fitness?action=connect');
      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          // Redirect to Google OAuth
          window.location.href = data.authUrl;
        } else {
          throw new Error('No auth URL returned');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }
    } catch (error) {
      console.error(`Error reconnecting ${type}:`, error);
      setReconnecting(null); // Reset loading state on error
    }
    // Note: Don't reset reconnecting state on success as user is being redirected
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'iPhone':
      case 'Apple Watch':
        return <IconBrandApple size={18} className="text-foreground" />;
      case 'Android':
      case 'Wear OS':
        return <IconBrandGoogle size={18} className="text-success" />;
      case 'Fitbit':
        return <IconDeviceWatch size={18} className="text-primary" />;
      default:
        return <IconDeviceMobile size={18} className="text-foreground-500" />;
    }
  };

  const getConnectionCard = (connection: DeviceConnection) => {
    return (
      <Card key={connection.type} shadow="none" className="shadow-sm border border-default-200">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconBrandGoogle size={20} className="text-success" />

              <div>
                <div className="font-medium">Google Fit</div>
                <div className="text-sm text-foreground-500">
                  {connection.deviceInfo ?
                    `${connection.deviceInfo.name} (${connection.deviceInfo.type})` :
                    'Android & Wear OS devices'
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Chip
                color={connection.isConnected ? "success" : "default"}
                variant="flat"
                size="sm"
                startContent={connection.isConnected ? <IconCheck size={12} /> : <IconX size={12} />}
              >
                {connection.isConnected ? "Connected" : "Not Connected"}
              </Chip>

              {/* Re-authenticate button */}
              {connection.isConnected && (
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<IconLogin size={12} />}
                  onPress={() => handleReconnect(connection.type)}
                  isLoading={reconnecting === connection.type}
                  className="text-xs"
                >
                  {reconnecting === connection.type ? "Reconnecting..." : "Reconnect"}
                </Button>
              )}
            </div>
          </div>

          {connection.lastSyncAt && (
            <div className="mt-2 text-xs text-foreground-500">
              Last sync: {new Date(connection.lastSyncAt).toLocaleString()}
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card shadow="none" className="shadow-md">
        <CardBody className="p-6 text-center">
          <div className="animate-pulse">Loading device connections...</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card shadow="none" className="shadow-md">
        <CardHeader className="px-4 pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IconDeviceMobile size={20} className="text-primary" />
            <span className="font-semibold">Device & Health Integrations</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            startContent={<IconSettings size={16} />}
            onPress={onOpen}
          >
            Manage
          </Button>
        </CardHeader>
        <CardBody className="px-4 pt-2">
          <div className="space-y-3">
            {connections.filter(connection => connection.type === 'GOOGLE_FIT' && connection.isConnected).map(connection => getConnectionCard(connection))}

            {connections.filter(connection => connection.type === 'GOOGLE_FIT' && !connection.isConnected).length > 0 && (
              <div className="text-center py-6 text-foreground-500">
                <IconBrandGoogle size={32} className="mx-auto mb-3 opacity-50" />
                <p className="mb-2">Google Fit not connected</p>
                <p className="text-xs mb-4">Connect Google Fit to automatically sync your step data</p>
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<IconBrandGoogle size={16} />}
                  onPress={() => handleReconnect('GOOGLE_FIT')}
                  isLoading={reconnecting === 'GOOGLE_FIT'}
                >
                  {reconnecting === 'GOOGLE_FIT' ? "Connecting..." : "Connect Google Fit"}
                </Button>
              </div>
            )}

            {connections.filter(connection => connection.type === 'GOOGLE_FIT').length === 0 && (
              <div className="text-center py-6 text-foreground-500">
                <IconBrandGoogle size={32} className="mx-auto mb-3 opacity-50" />
                <p className="mb-2">Google Fit not available</p>
                <p className="text-xs mb-4">Connect Google Fit to automatically sync your step data</p>
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<IconBrandGoogle size={16} />}
                  onPress={() => handleReconnect('GOOGLE_FIT')}
                  isLoading={reconnecting === 'GOOGLE_FIT'}
                >
                  {reconnecting === 'GOOGLE_FIT' ? "Connecting..." : "Connect Google Fit"}
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Device Management Modal */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Device Connections"
        size="xl"
      >
        <div className="space-y-6">
          {/* Supported Devices */}
          <div>
            <h4 className="font-medium mb-3">Supported Devices & Platforms</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-default-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <IconBrandGoogle size={18} />
                  <span className="font-medium">Google Ecosystem</span>
                </div>
                <ul className="text-sm text-foreground-600 space-y-1">
                  <li>• Android phones</li>
                  <li>• Wear OS watches</li>
                  <li>• Google Fit app</li>
                </ul>
              </div>

              <div className="p-3 border border-default-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <IconDeviceWatch size={18} />
                  <span className="font-medium">Compatible Smartwatches</span>
                </div>
                <ul className="text-sm text-foreground-600 space-y-1">
                  <li>• Fitbit (syncs to Google Fit)</li>
                  <li>• Samsung Galaxy Watch</li>
                  <li>• Garmin (via Google Fit)</li>
                  <li>• Most Wear OS devices</li>
                </ul>
              </div>
            </div>
          </div>

          <Divider />

          {/* Connection Instructions */}
          <div>
            <h4 className="font-medium mb-3">How to Connect Google Fit</h4>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <div className="font-medium text-success mb-1">Step 1: Install Google Fit</div>
                <p>Download Google Fit app from Google Play Store or Apple App Store</p>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="font-medium text-primary mb-1">Step 2: Connect Account</div>
                <p>Click the "Connect Google Fit" button and sign in with your Google account</p>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="font-medium text-warning mb-1">Step 3: Automatic Sync</div>
                <p>Your steps will be automatically counted from 12AM and synced throughout the day</p>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}