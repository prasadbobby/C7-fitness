"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Progress } from "@nextui-org/progress";
import { Tooltip } from "@nextui-org/tooltip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import {
  IconRefresh,
  IconWalk,
  IconTarget,
  IconClock,
  IconWifi,
  IconWifiOff,
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconBulb
} from "@tabler/icons-react";
import { toast } from "sonner";

interface StepData {
  actualSteps: number;
  targetSteps: number;
  isCompleted: boolean;
  dataSource: string;
  completionPercentage: number;
  lastUpdated?: string;
}

interface SyncStatus {
  status: 'fresh' | 'stale' | 'very_stale' | 'unknown';
  lastSync: Date | null;
  recommendation: string;
  canImprove: boolean;
  improvementTips: string[];
  statusIcon: string;
  statusColor: string;
}

interface SmartSyncData {
  steps: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'intraday' | 'daily-api' | 'cached';
  lastSync: Date;
  message: string;
}

interface EnhancedStepSyncProps {
  stepData: StepData | null;
  onDataUpdate: (data: StepData) => void;
}

export default function EnhancedStepSync({ stepData, onDataUpdate }: EnhancedStepSyncProps) {
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [smartSyncData, setSmartSyncData] = useState<SmartSyncData | null>(null);

  // Fetch sync status on component mount
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/fitbit/enhanced-sync?action=status');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const performSmartSync = async () => {
    setLoading(true);

    try {
      toast.info('🧠 Performing smart sync...', { duration: 2000 });

      const response = await fetch('/api/fitbit/enhanced-sync?action=smart-sync');

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setSmartSyncData(result.data);

          // Update step data
          const updatedStepData: StepData = {
            actualSteps: result.data.steps,
            targetSteps: stepData?.targetSteps || 10000,
            isCompleted: result.data.steps >= (stepData?.targetSteps || 10000),
            dataSource: 'FITBIT',
            completionPercentage: Math.round((result.data.steps / (stepData?.targetSteps || 10000)) * 100),
            lastUpdated: new Date().toISOString()
          };

          onDataUpdate(updatedStepData);

          // Show success message based on confidence
          const message = getSuccessMessage(result.data.confidence, result.data.source);
          toast.success(message, { duration: 4000 });

          // Refresh sync status
          await fetchSyncStatus();
        } else {
          toast.error(result.message || 'Smart sync failed');
        }
      } else {
        throw new Error('Smart sync request failed');
      }
    } catch (error) {
      console.error('Smart sync error:', error);
      toast.error('Failed to sync step data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateDataFreshness = async () => {
    try {
      toast.info('🔍 Validating data freshness...', { duration: 1500 });

      const response = await fetch('/api/fitbit/enhanced-sync?action=validate');

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          const validation = result.validation;

          if (validation.isFresh) {
            toast.success('✅ Your step data is fresh and accurate!', { duration: 3000 });
          } else {
            toast.warning(`⚠️ ${validation.recommendation}`, { duration: 5000 });
          }
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate data freshness');
    }
  };

  const getSuccessMessage = (confidence: string, source: string): string => {
    switch (confidence) {
      case 'high':
        return '✨ Got real-time step data from Fitbit!';
      case 'medium':
        return '📊 Updated with recent Fitbit data';
      case 'low':
        return '📱 Showing cached data - consider opening Fitbit app';
      default:
        return '✅ Step data updated successfully';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'success';
      case 'stale': return 'warning';
      case 'very_stale': return 'danger';
      case 'unknown': return 'danger';
      default: return 'default';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'danger';
      default: return 'default';
    }
  };

  if (!stepData) {
    return (
      <Card shadow="none" className="shadow-md">
        <CardBody className="p-4 text-center">
          <div className="space-y-3">
            <IconWifiOff size={24} className="mx-auto text-danger" />
            <p className="text-sm text-foreground-500">
              No step data available. Connect your Fitbit to start tracking.
            </p>
            <Button
              size="sm"
              color="primary"
              onPress={() => window.open('/api/fitbit/auth', '_blank')}
            >
              Connect Fitbit
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card shadow="none" className="shadow-md">
        <CardHeader className="px-3 text-xs uppercase flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IconWalk size={18} className="text-primary" />
            <span>Today's Steps</span>
            {syncStatus && (
              <Tooltip content={syncStatus.recommendation}>
                <Chip
                  size="sm"
                  variant="flat"
                  color={getStatusColor(syncStatus.status) as any}
                  startContent={<span className="text-xs">{syncStatus.statusIcon}</span>}
                  className="cursor-help"
                >
                  {syncStatus.status}
                </Chip>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip content="Validate data freshness">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={validateDataFreshness}
              >
                <IconInfoCircle size={14} />
              </Button>
            </Tooltip>

            <Tooltip content="Smart sync with multiple sources">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="primary"
                onPress={performSmartSync}
                isLoading={loading}
              >
                <IconRefresh size={14} />
              </Button>
            </Tooltip>

            {syncStatus?.canImprove && (
              <Tooltip content="View sync recommendations">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="warning"
                  onPress={() => setIsStatusModalOpen(true)}
                >
                  <IconBulb size={14} />
                </Button>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardBody className="px-3 pt-0">
          <div className="space-y-3">
            {/* Step Progress */}
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-foreground">
                {stepData.actualSteps.toLocaleString()}
              </div>
              <div className="text-sm text-foreground-500">
                / {stepData.targetSteps.toLocaleString()} steps
              </div>
              <div className="flex items-center gap-2">
                <IconTarget size={16} className="text-success" />
                <span className={`text-sm font-medium ${
                  stepData.isCompleted ? 'text-success' : 'text-warning'
                }`}>
                  {stepData.completionPercentage}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress
              value={Math.min(stepData.completionPercentage, 100)}
              color={stepData.isCompleted ? 'success' : stepData.completionPercentage >= 50 ? 'primary' : 'warning'}
              className="w-full"
              size="sm"
            />

            {/* Data Quality Indicator */}
            {smartSyncData && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={getConfidenceColor(smartSyncData.confidence) as any}
                    startContent={<IconWifi size={10} />}
                  >
                    {smartSyncData.confidence} quality
                  </Chip>
                  <span className="text-foreground-500">
                    via {smartSyncData.source}
                  </span>
                </div>

                {stepData.lastUpdated && (
                  <div className="flex items-center gap-1 text-foreground-500">
                    <IconClock size={10} />
                    <span>
                      {new Date(stepData.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Achievement Badge */}
            {stepData.isCompleted && (
              <Chip
                size="sm"
                color="success"
                variant="flat"
                startContent={<IconCheck size={12} />}
                className="w-full justify-center"
              >
                Daily Goal Achieved! 🎉
              </Chip>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Sync Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <IconBulb size={20} className="text-warning" />
                Sync Recommendations
              </ModalHeader>
              <ModalBody>
                {syncStatus && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                      <span className="text-2xl">{syncStatus.statusIcon}</span>
                      <div>
                        <p className="font-medium text-warning-700 dark:text-warning-300">
                          {syncStatus.recommendation}
                        </p>
                        {syncStatus.lastSync && (
                          <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                            Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {syncStatus.improvementTips.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <IconAlertCircle size={16} />
                          How to improve accuracy:
                        </h4>
                        <ul className="space-y-2">
                          {syncStatus.improvementTips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-primary mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Got it!
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}