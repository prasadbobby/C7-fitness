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
  IconRefresh,
  IconSettings,
  IconCheck,
  IconX,
  IconClock,
  IconBrandTelegram
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";

interface FitbitConnectionStatus {
  isConnected: boolean;
  lastSyncAt?: string;
  syncEnabled: boolean;
  tokenValid?: boolean;
  connectionCreated?: string;
  message?: string;
}

export default function FitbitIntegration() {
  const [connectionStatus, setConnectionStatus] = useState<FitbitConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchConnectionStatus();

    // Check for connection callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const fitbitStatus = urlParams.get('fitbit');

    if (fitbitStatus === 'connected') {
      // Connection successful - refresh status
      setTimeout(fetchConnectionStatus, 1000);
    } else if (fitbitStatus === 'error') {
      console.error('Fitbit connection failed');
    }
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch("/api/fitbit/connection");

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data);
      }
    } catch (error) {
      console.error("Error fetching Fitbit connection status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/fitbit/auth");

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          // Redirect to Fitbit authorization
          window.location.href = data.authUrl;
        }
      } else {
        console.error("Failed to get Fitbit auth URL");
      }
    } catch (error) {
      console.error("Error initiating Fitbit connection:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/fitbit/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          days: 2 // Sync today + yesterday
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fitbit sync completed:", data);

        // Immediately update the lastSyncAt in the UI for instant feedback
        if (connectionStatus) {
          setConnectionStatus({
            ...connectionStatus,
            lastSyncAt: new Date().toISOString()
          });
        }

        // Wait a moment for database transaction to complete, then refresh from server
        setTimeout(async () => {
          await fetchConnectionStatus();
        }, 500);

        // Emit event to refresh step data in parent component
        window.dispatchEvent(new CustomEvent('fitbitSyncComplete'));
      } else {
        console.error("Fitbit sync failed");
      }
    } catch (error) {
      console.error("Error syncing Fitbit data:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/fitbit/connection", {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchConnectionStatus();
        onClose();
      }
    } catch (error) {
      console.error("Error disconnecting Fitbit:", error);
    }
  };

  const toggleSync = async () => {
    if (!connectionStatus) return;

    try {
      const response = await fetch("/api/fitbit/connection", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          syncEnabled: !connectionStatus.syncEnabled,
        }),
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
      <Card>
        <CardBody className="flex items-center justify-center">
          <Spinner size="sm" />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        {/* Redesigned Header with Better Positioning */}
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-[#00B4A6] rounded-full flex-shrink-0">
              <IconBrandTelegram size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-md sm:text-lg font-semibold truncate">Fitbit Integration</p>
              <p className="text-small sm:text-sm text-default-500 truncate">
                Automatically sync your step data from Fitbit
              </p>
            </div>
          </div>

          {/* Settings Icon - Positioned on the Right */}
          {connectionStatus?.isConnected && (
            <Button
              size="sm"
              variant="light"
              className="sm:size-md flex-shrink-0"
              isIconOnly
              startContent={<IconSettings size={18} className="sm:w-5 sm:h-5" />}
              onPress={onOpen}
            />
          )}
        </CardHeader>

        <CardBody className="pt-0 px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Connection Status & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-medium">Status:</span>
                {connectionStatus?.isConnected ? (
                  <Chip
                    startContent={<IconCheck size={16} className="sm:w-5 sm:h-5" />}
                    variant="flat"
                    color="success"
                    size="sm"
                    className="sm:text-sm"
                  >
                    Connected
                  </Chip>
                ) : (
                  <Chip
                    startContent={<IconX size={16} className="sm:w-5 sm:h-5" />}
                    variant="flat"
                    color="danger"
                    size="sm"
                    className="sm:text-sm"
                  >
                    Not Connected
                  </Chip>
                )}
              </div>

              {/* Connect Button - Only show when not connected */}
              {!connectionStatus?.isConnected && (
                <Button
                  size="sm"
                  color="primary"
                  className="sm:size-md w-full sm:w-auto"
                  onPress={handleConnect}
                  isLoading={connecting}
                  startContent={!connecting ? <IconBrandTelegram size={16} /> : undefined}
                >
                  {connecting ? "Connecting..." : "Connect Fitbit"}
                </Button>
              )}
            </div>

            {/* Connected State Info */}
            {connectionStatus?.isConnected && (
              <div className="flex flex-col gap-3 sm:gap-4 border-t border-divider pt-4">
                {/* Last Sync Info */}
                {connectionStatus.lastSyncAt && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm sm:text-base text-default-600">
                      <IconClock size={16} className="sm:w-5 sm:h-5 text-default-400" />
                      <span className="font-medium">Last sync:</span>
                    </div>
                    <span className="text-sm sm:text-base text-default-500 sm:text-right">
                      {new Date(connectionStatus.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Auto-sync Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm sm:text-base font-medium text-default-600">Auto-sync:</span>
                  <Chip
                    variant="flat"
                    color={connectionStatus.syncEnabled ? "success" : "default"}
                    size="sm"
                    className="sm:text-sm w-fit"
                  >
                    {connectionStatus.syncEnabled ? "Enabled" : "Disabled"}
                  </Chip>
                </div>
              </div>
            )}

            {/* Connection Message/Status */}
            {connectionStatus?.message && (
              <div className="bg-default-100 rounded-lg p-3 sm:p-4">
                <p className="text-sm sm:text-base text-default-600">
                  {connectionStatus.message}
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Settings Bottom Sheet - Enhanced for Mobile/Desktop */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Fitbit Settings"
      >
        <div className="flex flex-col gap-6 p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {/* Connection Info Card */}
          <div className="bg-default-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-[#00B4A6] rounded-full">
                <IconBrandTelegram size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Fitbit Connected</p>
                <p className="text-xs text-default-500">
                  {connectionStatus?.connectionCreated
                    ? `Connected ${new Date(connectionStatus.connectionCreated).toLocaleDateString()}`
                    : 'Connection active'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Auto-sync Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <p className="font-medium text-base">Auto-sync</p>
              <p className="text-sm text-default-500 mt-1">
                Automatically sync step data from Fitbit every hour
              </p>
            </div>
            <Button
              size="md"
              variant={connectionStatus?.syncEnabled ? "solid" : "flat"}
              color={connectionStatus?.syncEnabled ? "success" : "default"}
              className="w-full sm:w-auto min-w-[100px]"
              onPress={toggleSync}
              startContent={
                connectionStatus?.syncEnabled ?
                <IconCheck size={16} /> :
                <IconX size={16} />
              }
            >
              {connectionStatus?.syncEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {/* Sync Status Info */}
          {connectionStatus?.lastSyncAt && (
            <div className="bg-default-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconClock size={16} className="text-default-400" />
                <p className="font-medium text-sm">Last Sync</p>
              </div>
              <p className="text-sm text-default-600">
                {new Date(connectionStatus.lastSyncAt).toLocaleString()}
              </p>
            </div>
          )}


          {/* Danger Zone */}
          <div className="border-t border-divider pt-6">
            <h3 className="font-semibold text-base text-danger mb-3">Disconnect</h3>
            <p className="text-sm text-default-500 mb-4">
              This will remove your Fitbit connection and stop all data syncing.
            </p>
            <Button
              color="danger"
              variant="flat"
              fullWidth
              className="h-12"
              startContent={<IconX size={16} />}
              onPress={handleDisconnect}
            >
              Disconnect Fitbit
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}