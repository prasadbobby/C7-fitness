"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
} from "@nextui-org/react";
import {
  IconCalendar,
  IconClock,
  IconShield,
  IconCalendarDue,
} from "@tabler/icons-react";

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

export default function ProfileMembership() {
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

          <div className="flex items-center gap-3">
            <div className="p-2 bg-content2 rounded-lg">
              <IconCalendarDue size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">End Date</p>
              <p className="text-sm font-medium">
                {new Date(membershipInfo.endDate!).toLocaleDateString()}
              </p>
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
    </Card>
  );
}