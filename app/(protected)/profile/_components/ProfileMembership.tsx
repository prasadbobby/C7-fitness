"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Button,
} from "@nextui-org/react";
import {
  IconCalendar,
  IconClock,
  IconShield,
  IconCalendarDue,
  IconHistory,
  IconUser,
  IconNotes,
} from "@tabler/icons-react";
import { format } from "date-fns";
import BottomSheet from "@/components/UI/BottomSheet";

interface MembershipInfo {
  startDate?: string;
  endDate?: string;
  duration?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
  daysRemaining: number;
  isExpired: boolean;
  isActive: boolean;
  hasValidMembership: boolean;
}

interface MembershipLog {
  id: string;
  changeType: string;
  previousStatus?: string;
  newStatus?: string;
  previousStartDate?: string;
  newStartDate?: string;
  previousEndDate?: string;
  newEndDate?: string;
  previousDuration?: number;
  newDuration?: number;
  changeDate: string;
  notes?: string;
  recordedByName: string;
  createdAt: string;
}

export default function ProfileMembership() {
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [membershipHistory, setMembershipHistory] = useState<MembershipLog[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchMembershipInfo();
  }, []);

  const fetchMembershipInfo = async () => {
    try {
      const response = await fetch('/api/membership');
      if (response.ok) {
        const data = await response.json();
        setMembershipInfo(data.membership);
      } else {
        console.error("Failed to fetch membership info");
      }
    } catch (error) {
      console.error("Error fetching membership info:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/membership-history');
      if (response.ok) {
        const data = await response.json();
        setMembershipHistory(data.membershipLogs || []);
      } else {
        console.error("Failed to fetch membership history");
      }
    } catch (error) {
      console.error("Error fetching membership history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryModal = () => {
    setIsHistoryModalOpen(true);
    fetchMembershipHistory();
  };

  const getChangeTypeDisplay = (changeType: string) => {
    switch (changeType) {
      case 'STATUS_CHANGE': return 'Status Changed';
      case 'DATE_CHANGE': return 'Dates Updated';
      case 'DURATION_CHANGE': return 'Duration Changed';
      case 'FULL_UPDATE': return 'Membership Updated';
      case 'INITIAL_SETUP': return 'Initial Setup';
      case 'EXTENSION': return 'Extended';
      case 'RENEWAL': return 'Renewed';
      case 'CANCELLATION': return 'Cancelled';
      case 'SUSPENSION': return 'Suspended';
      case 'REACTIVATION': return 'Reactivated';
      default: return changeType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'INITIAL_SETUP': return 'success';
      case 'EXTENSION': return 'success';
      case 'RENEWAL': return 'success';
      case 'REACTIVATION': return 'success';
      case 'CANCELLATION': return 'danger';
      case 'SUSPENSION': return 'warning';
      case 'STATUS_CHANGE': return 'primary';
      case 'DATE_CHANGE': return 'secondary';
      case 'DURATION_CHANGE': return 'secondary';
      case 'FULL_UPDATE': return 'primary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "INACTIVE": return "default";
      case "EXPIRED": return "danger";
      case "SUSPENDED": return "warning";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return <IconShield size={24} className="text-success" />;
      case "EXPIRED": return <IconCalendarDue size={24} className="text-danger" />;
      case "SUSPENDED": return <IconClock size={24} className="text-warning" />;
      default: return <IconShield size={24} className="text-default-400" />;
    }
  };

  const calculateProgress = () => {
    if (!membershipInfo?.duration || !membershipInfo?.hasValidMembership) return 0;

    const totalDays = membershipInfo.duration;
    const remainingDays = Math.max(0, membershipInfo.daysRemaining);
    const usedDays = totalDays - remainingDays;

    return Math.min(100, Math.max(0, (usedDays / totalDays) * 100));
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardBody className="p-6">
          <div className="flex justify-center items-center h-20">
            <span className="text-sm text-zinc-500">Loading membership...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!membershipInfo?.hasValidMembership) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-default-100 rounded-lg">
              <IconShield size={24} className="text-default-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Gym Membership</h3>
              <p className="text-sm text-zinc-500">No active membership</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="text-center py-6">
            <p className="text-zinc-500 mb-2">You don't have an active gym membership.</p>
            <p className="text-sm text-zinc-400">Contact the admin to set up your membership.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const progress = calculateProgress();
  const progressColor = membershipInfo.isExpired ? "danger" :
                       membershipInfo.daysRemaining <= 7 ? "warning" : "success";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {getStatusIcon(membershipInfo.status)}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Gym Membership</h3>
            <Chip
              color={getStatusColor(membershipInfo.status)}
              variant="flat"
              size="sm"
            >
              {membershipInfo.status}
            </Chip>
          </div>
        </div>
        <Button
          variant="light"
          size="sm"
          startContent={<IconHistory size={16} />}
          onPress={openHistoryModal}
          className="text-foreground-500 hover:text-foreground-700"
        >
          View History
        </Button>
      </CardHeader>

      <CardBody className="pt-0 space-y-4">
        {/* Membership Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-content2 rounded-lg">
              <IconCalendar size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Start Date</p>
              <p className="text-sm font-medium">
                {new Date(membershipInfo.startDate!).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <p className="text-xs text-zinc-500">End Date</p>
              <p className="text-sm font-medium">
                {new Date(membershipInfo.endDate!).toLocaleDateString()}
              </p>
            </div>
            <div className="p-2 bg-content2 rounded-lg">
              <IconCalendarDue size={20} className="text-warning" />
            </div>
          </div>
        </div>

        {/* Days Remaining */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IconClock size={16} className={membershipInfo.isExpired ? "text-danger" : "text-success"} />
              <span className="text-sm font-medium">
                {membershipInfo.isExpired ? "Membership Expired" : "Days Remaining"}
              </span>
            </div>
            <span className={`text-lg font-bold ${membershipInfo.isExpired ? "text-danger" : "text-success"}`}>
              {membershipInfo.isExpired ? "0" : membershipInfo.daysRemaining}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress
              value={progress}
              color={progressColor}
              size="lg"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Start</span>
              <span>
                {membershipInfo.isExpired
                  ? "Expired"
                  : `${Math.round(progress)}% used`
                }
              </span>
              <span>End</span>
            </div>
          </div>
        </div>

        {/* Warning for expiring soon */}
        {!membershipInfo.isExpired && membershipInfo.daysRemaining <= 7 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2">
              <IconCalendarDue size={16} className="text-warning" />
              <span className="text-sm font-medium text-warning">
                Membership expires soon!
              </span>
            </div>
            <p className="text-xs text-warning/80 mt-1">
              Your membership will expire in {membershipInfo.daysRemaining} day{membershipInfo.daysRemaining !== 1 ? 's' : ''}.
              Contact admin for renewal.
            </p>
          </div>
        )}

        {/* Expired warning */}
        {membershipInfo.isExpired && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
            <div className="flex items-center gap-2">
              <IconCalendarDue size={16} className="text-danger" />
              <span className="text-sm font-medium text-danger">
                Membership Expired
              </span>
            </div>
            <p className="text-xs text-danger/80 mt-1">
              Your gym access has expired. Please contact admin to renew your membership.
            </p>
          </div>
        )}

        {/* Membership Duration Info */}
        <div className="text-center pt-2 border-t border-divider">
          <p className="text-xs text-zinc-500">
            Total membership duration: {membershipInfo.duration} days
            ({Math.round(membershipInfo.duration! / 30 * 10) / 10} months)
          </p>
        </div>
      </CardBody>

      {/* Membership History Modal */}
      <BottomSheet
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Membership History"
        size="3xl"
      >
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-sm text-foreground-500">Loading membership history...</div>
            </div>
          ) : membershipHistory.length === 0 ? (
            <div className="text-center py-8">
              <IconHistory size={48} className="text-foreground-300 mx-auto mb-3" />
              <p className="text-foreground-500 mb-2">No membership history found</p>
              <p className="text-sm text-foreground-400">
                Membership changes will appear here when made by administrators.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {membershipHistory.map((log, index) => (
                <Card key={log.id} className="bg-content1 border border-divider">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Chip
                            color={getChangeTypeColor(log.changeType)}
                            variant="flat"
                            size="sm"
                            className="font-medium"
                          >
                            {getChangeTypeDisplay(log.changeType)}
                          </Chip>
                        </div>
                        <div className="text-xs text-foreground-500">
                          {format(new Date(log.changeDate), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>

                    {/* Changes Made */}
                    <div className="space-y-2 mb-3">
                      {log.previousStatus !== log.newStatus && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-foreground-600">Status:</span>
                          <span className="text-foreground-400">{log.previousStatus || 'None'}</span>
                          <span className="text-foreground-400">→</span>
                          <Chip size="sm" color={getStatusColor(log.newStatus || '')} variant="flat">
                            {log.newStatus}
                          </Chip>
                        </div>
                      )}

                      {log.previousStartDate !== log.newStartDate && log.newStartDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-foreground-600">Start Date:</span>
                          <span className="text-foreground-400">
                            {log.previousStartDate ? format(new Date(log.previousStartDate), 'MMM dd, yyyy') : 'None'}
                          </span>
                          <span className="text-foreground-400">→</span>
                          <span className="text-foreground-700">
                            {format(new Date(log.newStartDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}

                      {log.previousEndDate !== log.newEndDate && log.newEndDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-foreground-600">End Date:</span>
                          <span className="text-foreground-400">
                            {log.previousEndDate ? format(new Date(log.previousEndDate), 'MMM dd, yyyy') : 'None'}
                          </span>
                          <span className="text-foreground-400">→</span>
                          <span className="text-foreground-700">
                            {format(new Date(log.newEndDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}

                      {log.previousDuration !== log.newDuration && log.newDuration && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-foreground-600">Duration:</span>
                          <span className="text-foreground-400">{log.previousDuration || 0} days</span>
                          <span className="text-foreground-400">→</span>
                          <span className="text-foreground-700">{log.newDuration} days</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <div className="flex items-start gap-2 mb-3">
                        <IconNotes size={16} className="text-foreground-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-foreground-600">{log.notes}</p>
                      </div>
                    )}

                    {/* Admin Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-divider">
                      <IconUser size={14} className="text-foreground-400" />
                      <span className="text-xs text-foreground-500">
                        Changed by {log.recordedByName}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </Card>
  );
}