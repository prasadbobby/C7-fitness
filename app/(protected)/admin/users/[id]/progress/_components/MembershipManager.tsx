"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Chip,
  useDisclosure,
} from "@nextui-org/react";
import {
  IconCalendar,
  IconClock,
  IconUserCheck,
  IconUserX,
  IconEdit,
  IconDeviceFloppy,
  IconAlertTriangle,
  IconShield,
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";
import DatePicker from "@/components/UI/DatePicker";
import { toast } from "sonner";

interface MembershipInfo {
  id: string;
  userId: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  membershipDuration?: number;
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
  membershipSetBy?: string;
  membershipNotes?: string;
  daysRemaining: number;
  isExpired: boolean;
}

interface MembershipManagerProps {
  userId: string;
  userInfo: {
    username?: string;
    firstName?: string;
    email?: string;
  };
}

const membershipStatusOptions = [
  { value: "ACTIVE", label: "Active", color: "success" },
  { value: "INACTIVE", label: "Inactive", color: "default" },
  { value: "EXPIRED", label: "Expired", color: "danger" },
  { value: "SUSPENDED", label: "Suspended", color: "warning" },
];

const durationPresets = [
  { label: "1 Month", value: 30 },
  { label: "3 Months", value: 90 },
  { label: "6 Months", value: 180 },
  { label: "1 Year", value: 365 },
];

export default function MembershipManager({ userId, userInfo }: MembershipManagerProps) {
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [duration, setDuration] = useState<string>("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [notes, setNotes] = useState<string>("");

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchMembershipInfo();
  }, [userId]);

  const fetchMembershipInfo = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/membership`);
      if (response.ok) {
        const data = await response.json();
        setMembershipInfo(data.membership);
      } else {
        console.error("Failed to fetch membership info");
      }
    } catch (error) {
      console.error("Error fetching membership info:", error);
      toast.error("Failed to load membership information");
    } finally {
      setLoading(false);
    }
  };

  const handleEditMembership = () => {
    if (membershipInfo?.membershipStartDate) {
      setStartDate(new Date(membershipInfo.membershipStartDate));
    } else {
      setStartDate(new Date());
    }
    setDuration(membershipInfo?.membershipDuration?.toString() || "90");
    setStatus(membershipInfo?.membershipStatus || "ACTIVE");
    setNotes(membershipInfo?.membershipNotes || "");
    onOpen();
  };

  const handleSetDurationPreset = (days: number) => {
    setDuration(days.toString());
  };

  const handleSaveMembership = async () => {
    if (!startDate || !duration) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/membership`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          duration: parseInt(duration),
          status,
          notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMembershipInfo(data.membership);
        toast.success("Membership updated successfully");
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to update membership: ${errorData.error || response.status}`);
      }
    } catch (error) {
      console.error("Error updating membership:", error);
      toast.error("Failed to update membership");
    } finally {
      setSaving(false);
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
      case "ACTIVE": return <IconUserCheck size={20} className="text-success" />;
      case "EXPIRED": return <IconUserX size={20} className="text-danger" />;
      case "SUSPENDED": return <IconAlertTriangle size={20} className="text-warning" />;
      default: return <IconShield size={20} className="text-default-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="flex justify-center items-center h-24">
            Loading membership information...
          </div>
        </CardBody>
      </Card>
    );
  }

  const hasValidMembership = membershipInfo?.membershipStartDate && membershipInfo?.membershipEndDate;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconShield size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Membership Validity</h3>
              <p className="text-sm text-foreground-500">
                Manage gym access for {userInfo?.username || userInfo?.firstName || userInfo?.email}
              </p>
            </div>
          </div>
          <Button
            color="primary"
            startContent={<IconEdit size={16} />}
            onPress={handleEditMembership}
          >
            {hasValidMembership ? "Edit Membership" : "Set Membership"}
          </Button>
        </CardHeader>
        <CardBody className="px-6 pt-0">
          {hasValidMembership ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-content2 rounded-lg">
                  {getStatusIcon(membershipInfo.membershipStatus)}
                </div>
                <div>
                  <p className="text-xs text-foreground-500">Status</p>
                  <Chip color={getStatusColor(membershipInfo.membershipStatus)} variant="flat" size="sm">
                    {membershipInfo.membershipStatus}
                  </Chip>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-content2 rounded-lg">
                  <IconCalendar size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-foreground-500">Start Date</p>
                  <p className="text-sm font-medium">
                    {new Date(membershipInfo.membershipStartDate!).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-content2 rounded-lg">
                  <IconCalendar size={20} className="text-warning" />
                </div>
                <div>
                  <p className="text-xs text-foreground-500">End Date</p>
                  <p className="text-sm font-medium">
                    {new Date(membershipInfo.membershipEndDate!).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Days Remaining */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-content2 rounded-lg">
                  <IconClock size={20} className={membershipInfo.isExpired ? "text-danger" : "text-success"} />
                </div>
                <div>
                  <p className="text-xs text-foreground-500">Days Remaining</p>
                  <p className={`text-sm font-medium ${membershipInfo.isExpired ? "text-danger" : "text-success"}`}>
                    {membershipInfo.isExpired ? "Expired" : `${membershipInfo.daysRemaining} days`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-content2 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <IconShield size={32} className="text-foreground-400" />
              </div>
              <h4 className="text-lg font-medium mb-2">No Membership Set</h4>
              <p className="text-foreground-500 mb-4">
                This user doesn't have a membership validity period configured.
              </p>
              <Button
                color="primary"
                startContent={<IconEdit size={16} />}
                onPress={handleEditMembership}
              >
                Set Membership Period
              </Button>
            </div>
          )}

          {membershipInfo?.membershipNotes && (
            <div className="mt-4 p-3 bg-content2 rounded-lg">
              <p className="text-xs text-foreground-500 mb-1">Notes</p>
              <p className="text-sm">{membershipInfo.membershipNotes}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Membership Modal */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Membership Validity"
        size="2xl"
        footer={
          <>
            <Button variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSaveMembership}
              isLoading={saving}
              startContent={<IconDeviceFloppy size={16} />}
            >
              Save Membership
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Start Date */}
          <DatePicker
            label="Membership Start Date *"
            value={startDate}
            onChange={setStartDate}
          />

          {/* Duration */}
          <div>
            <Input
              type="number"
              label="Duration (Days) *"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Enter duration in days"
              min="1"
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              <p className="text-sm text-foreground-500 w-full mb-2">Quick presets:</p>
              {durationPresets.map((preset) => (
                <Button
                  key={preset.value}
                  size="sm"
                  variant="flat"
                  onPress={() => handleSetDurationPreset(preset.value)}
                  className={duration === preset.value.toString() ? "bg-primary text-primary-foreground" : ""}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Status */}
          <Select
            label="Membership Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            selectedKeys={[status]}
          >
            {membershipStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>

          {/* Notes */}
          <Textarea
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this membership..."
            rows={3}
          />

          {/* Preview */}
          {startDate && duration && (
            <Card>
              <CardBody className="bg-content2">
                <p className="text-sm font-medium mb-2">Membership Preview:</p>
                <div className="text-sm space-y-1">
                  <p><strong>Start:</strong> {startDate.toLocaleDateString()}</p>
                  <p><strong>End:</strong> {new Date(startDate.getTime() + parseInt(duration) * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  <p><strong>Duration:</strong> {duration} days ({Math.round(parseInt(duration) / 30 * 10) / 10} months)</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </BottomSheet>
    </>
  );
}