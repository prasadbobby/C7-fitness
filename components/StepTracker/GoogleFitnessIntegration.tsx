"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  useDisclosure,
  Spinner
} from "@nextui-org/react";
import {
  IconBrandGoogle,
  IconRefresh,
  IconSettings,
  IconCheck,
  IconX,
  IconClock
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";

interface GoogleFitnessConnectionStatus {
  isConnected: boolean;
  lastSyncAt?: string;
  syncEnabled: boolean;
  tokenValid?: boolean;
  connectionCreated?: string;
}

interface SyncStatus {
  id: string;
  syncType: string;
  status: string;
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  errorMessage?: string;
}

export default function GoogleFitnessIntegration() {
  const [connectionStatus, setConnectionStatus] = useState<GoogleFitnessConnectionStatus | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      const [connectionResponse, syncResponse] = await Promise.all([
        fetch("/api/fitness/connection"),
        fetch("/api/fitness/sync")
      ]);

      if (connectionResponse.ok) {
        const connectionData = await connectionResponse.json();
        setConnectionStatus(connectionData);
      }

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        setRecentSyncs(syncData.recentSyncs || []);
      }
    } catch (error) {
      console.error("Error fetching connection status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/auth/google-fitness?action=connect");
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error connecting to Google Fitness:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/fitness/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Sync completed:", result);
        // Refresh status and parent component
        await fetchConnectionStatus();
        // You might want to trigger a refresh of the step data here
        window.location.reload(); // Simple way to refresh all step data
      }
    } catch (error) {
      console.error("Error syncing data:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/fitness/connection", {
        method: "DELETE"
      });

      if (response.ok) {
        await fetchConnectionStatus();
        onClose();
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const toggleSync = async () => {
    try {
      const response = await fetch("/api/fitness/connection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncEnabled: !connectionStatus?.syncEnabled })
      });

      if (response.ok) {
        await fetchConnectionStatus();
      }
    } catch (error) {
      console.error("Error toggling sync:", error);
    }
  };

  if (loading) {
    return (
      <Card shadow="none" className="shadow-md">
        <CardBody className="flex items-center justify-center p-6">
          <Spinner size="md" />
        </CardBody>
      </Card>
    );
  }

  const isConnected = connectionStatus?.isConnected && connectionStatus?.tokenValid;

  return (
    <>
      <Card shadow="none" className="shadow-md">
        <CardHeader className="px-3 text-xs uppercase block w-full truncate flex gap-3">
          <IconBrandGoogle size={22} className="text-primary" />
          Google Fitness Integration
        </CardHeader>
        <CardBody className="px-3 pt-0">
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Chip
                  color={isConnected ? "success" : "default"}
                  variant="flat"
                  startContent={isConnected ? <IconCheck size={16} /> : <IconX size={16} />}
                >
                  {isConnected ? "Connected" : "Not Connected"}
                </Chip>
                {connectionStatus?.lastSyncAt && (
                  <span className="text-sm text-foreground-500">
                    Last sync: {new Date(connectionStatus.lastSyncAt).toLocaleString()}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onPress={onOpen}
                startContent={<IconSettings size={16} />}
              >
                Settings
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!isConnected ? (
                <Button
                  color="primary"
                  startContent={<IconBrandGoogle size={16} />}
                  onPress={handleConnect}
                  isLoading={connecting}
                  size="sm"
                  className="flex-1"
                >
                  Connect Google Fitness
                </Button>
              ) : (
                <>
                  <Button
                    color="secondary"
                    variant="flat"
                    startContent={<IconRefresh size={16} />}
                    onPress={handleSync}
                    isLoading={syncing}
                    size="sm"
                    isDisabled={!connectionStatus?.syncEnabled}
                  >
                    Sync Now
                  </Button>
                  <Button
                    variant="flat"
                    size="sm"
                    onPress={toggleSync}
                    color={connectionStatus?.syncEnabled ? "warning" : "success"}
                  >
                    {connectionStatus?.syncEnabled ? "Disable Auto-Sync" : "Enable Auto-Sync"}
                  </Button>
                </>
              )}
            </div>

            {/* Recent Sync Status */}
            {recentSyncs.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground-500 mb-2">Recent Syncs</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentSyncs.slice(0, 3).map((sync) => (
                    <div
                      key={sync.id}
                      className="flex items-center justify-between text-xs p-2 bg-default-100 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Chip
                          size="sm"
                          color={
                            sync.status === "COMPLETED"
                              ? "success"
                              : sync.status === "FAILED"
                              ? "danger"
                              : "warning"
                          }
                          variant="flat"
                        >
                          {sync.status}
                        </Chip>
                        <span>{sync.recordsProcessed} records</span>
                      </div>
                      <span className="text-foreground-500">
                        {new Date(sync.startTime).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Text */}
            {!isConnected && (
              <div className="text-xs text-foreground-500 p-3 bg-default-50 rounded">
                Connect your Google Fitness account to automatically sync your step count, heart rate,
                and other fitness data. Make sure you have Google Fit app installed on your phone.
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Settings Modal */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Google Fitness Settings"
        size="lg"
      >
        <div className="space-y-4">
          {isConnected ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Auto-sync enabled:</span>
                  <Chip color={connectionStatus?.syncEnabled ? "success" : "default"}>
                    {connectionStatus?.syncEnabled ? "Yes" : "No"}
                  </Chip>
                </div>

                {connectionStatus?.lastSyncAt && (
                  <div className="flex justify-between items-center">
                    <span>Last sync:</span>
                    <span className="text-sm">
                      {new Date(connectionStatus.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {connectionStatus?.connectionCreated && (
                  <div className="flex justify-between items-center">
                    <span>Connected since:</span>
                    <span className="text-sm">
                      {new Date(connectionStatus.connectionCreated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  variant="flat"
                  color="secondary"
                  onPress={handleSync}
                  isLoading={syncing}
                  startContent={<IconRefresh size={16} />}
                  className="w-full"
                  isDisabled={!connectionStatus?.syncEnabled}
                >
                  Sync Last 7 Days
                </Button>

                <Button
                  variant="flat"
                  color={connectionStatus?.syncEnabled ? "warning" : "success"}
                  onPress={toggleSync}
                  className="w-full"
                >
                  {connectionStatus?.syncEnabled ? "Disable Auto-Sync" : "Enable Auto-Sync"}
                </Button>

                <Button
                  color="danger"
                  variant="flat"
                  onPress={handleDisconnect}
                  className="w-full"
                  startContent={<IconX size={16} />}
                >
                  Disconnect Google Fitness
                </Button>
              </div>

              <div className="text-xs text-foreground-500 p-3 bg-default-50 rounded">
                <strong>Note:</strong> Disabling auto-sync will stop automatic data synchronization,
                but you can still manually sync when needed. Disconnecting will remove all access
                to your Google Fitness data.
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-sm text-foreground-500">
                To connect Google Fitness, you'll need to:
              </div>
              <div className="text-left space-y-2 text-sm">
                <div>1. Have Google Fit app installed on your phone</div>
                <div>2. Allow access to your fitness data</div>
                <div>3. Grant permission to read steps, heart rate, and activity data</div>
              </div>
              <Button
                color="primary"
                startContent={<IconBrandGoogle size={16} />}
                onPress={handleConnect}
                isLoading={connecting}
                className="w-full"
              >
                Connect to Google Fitness
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}