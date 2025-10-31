"use client";

import { useState } from "react";
import { Card, CardBody, Button, Chip } from "@nextui-org/react";
import { IconRefresh, IconCheck } from "@tabler/icons-react";

export default function PullToRefreshDemo() {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardBody className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <IconRefresh size={24} className="text-primary" />
          <h3 className="text-lg font-semibold">Pull-to-Refresh Demo</h3>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-foreground-600">
            On mobile devices, pull down from the top of any page to refresh!
          </p>

          <div className="p-3 bg-content2 rounded-lg">
            <p className="text-xs font-medium mb-2">How it works:</p>
            <ul className="text-xs text-foreground-500 space-y-1 text-left">
              <li>• Pull down from the top of the page</li>
              <li>• See the refresh animation</li>
              <li>• Release when you see "Release to refresh"</li>
              <li>• Page will refresh with router.refresh()</li>
            </ul>
          </div>

          {lastRefresh && (
            <div className="flex items-center justify-center gap-2 p-2 bg-success/10 rounded-lg">
              <IconCheck size={16} className="text-success" />
              <span className="text-xs text-success">
                Last refreshed: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          )}

          <Button
            color="primary"
            variant="flat"
            size="sm"
            startContent={<IconRefresh size={16} />}
            onPress={handleManualRefresh}
          >
            Manual Refresh Test
          </Button>

          <div className="flex flex-wrap gap-2 justify-center">
            <Chip size="sm" variant="flat" color="primary">Mobile Gestures</Chip>
            <Chip size="sm" variant="flat" color="success">Smooth Animation</Chip>
            <Chip size="sm" variant="flat" color="secondary">Global Integration</Chip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}