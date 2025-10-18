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
  IconHistory,
  IconUser,
  IconNotes,
  IconPlus,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { format } from "date-fns";
import BottomSheet from "@/components/UI/BottomSheet";
import DatePicker from "@/components/UI/DatePicker";
import { toast } from "sonner";

interface MembershipInfo {
  id: string;
  userId: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  membershipDuration?: number;
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'PAUSED' | 'UPCOMING' | 'CANCELLED';
  membershipSetBy?: string;
  membershipNotes?: string;
  daysRemaining: number;
  isExpired: boolean;
  isPaused?: boolean;
  isUpcoming?: boolean;
  statusDetails?: any;
  canExtend?: boolean;
  canPause?: boolean;
  canResume?: boolean;
  canCancel?: boolean;
  // Extension fields
  originalEndDate?: string;
  totalPausedDays?: number;
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
  const [membershipHistory, setMembershipHistory] = useState<MembershipLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [duration, setDuration] = useState<string>("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [notes, setNotes] = useState<string>("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  const { isOpen: isExtendOpen, onOpen: onExtendOpen, onClose: onExtendClose } = useDisclosure();

  // Extension form states
  const [extensionType, setExtensionType] = useState<string>("DAYS");
  const [extensionValue, setExtensionValue] = useState<string>("");
  const [extensionReason, setExtensionReason] = useState<string>("");
  const [extending, setExtending] = useState(false);

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

  const fetchMembershipHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/membership-history`);
      if (response.ok) {
        const data = await response.json();
        setMembershipHistory(data.membershipLogs || []);
      } else {
        console.error("Failed to fetch membership history");
      }
    } catch (error) {
      console.error("Error fetching membership history:", error);
      toast.error("Failed to load membership history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryModal = () => {
    onHistoryOpen();
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

  const handleExtendMembership = async () => {
    if (!extensionValue || parseInt(extensionValue) <= 0) {
      toast.error("Please enter a valid extension value");
      return;
    }

    if (!membershipInfo?.id) {
      toast.error("Membership information not available");
      return;
    }

    setExtending(true);
    try {
      const response = await fetch(`/api/admin/users/${membershipInfo.id}/membership/extend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extensionType,
          extensionValue: parseInt(extensionValue),
          reason: extensionReason || `Extended by ${extensionValue} ${extensionType.toLowerCase()}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMembershipInfo(data.membership);
        toast.success(`Membership extended by ${extensionValue} ${extensionType.toLowerCase()}!`);

        // Reset form
        setExtensionValue("");
        setExtensionReason("");
        onExtendClose();

        // Refresh data
        fetchMembershipInfo();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to extend membership: ${errorData.error || response.status}`);
      }
    } catch (error) {
      console.error("Error extending membership:", error);
      toast.error("Failed to extend membership");
    } finally {
      setExtending(false);
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
          <div className="flex gap-2">
            <Button
              variant="light"
              size="sm"
              startContent={<IconHistory size={16} />}
              onPress={openHistoryModal}
              className="text-foreground-500 hover:text-foreground-700"
            >
              View History
            </Button>
            {hasValidMembership && membershipInfo?.canExtend && (
              <Button
                color="success"
                variant="flat"
                size="sm"
                startContent={<IconPlus size={16} />}
                onPress={onExtendOpen}
                className="text-success hover:text-success-700"
              >
                Extend
              </Button>
            )}
            <Button
              color="primary"
              startContent={<IconEdit size={16} />}
              onPress={handleEditMembership}
            >
              {hasValidMembership ? "Edit Membership" : "Set Membership"}
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-6 pt-0">
          {hasValidMembership ? (
            <>
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

            {/* Extension Information */}
            {(membershipInfo.originalEndDate && membershipInfo.membershipEndDate &&
             membershipInfo.originalEndDate !== membershipInfo.membershipEndDate) && (
              <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <IconPlus size={16} className="text-success" />
                  <span className="text-sm font-medium text-success">Membership Extended</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-foreground-500">Original End Date</p>
                    <p className="font-medium">{new Date(membershipInfo.originalEndDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-foreground-500">Extended To</p>
                    <p className="font-medium text-success">{new Date(membershipInfo.membershipEndDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-foreground-500">
                    Extended by {Math.ceil((new Date(membershipInfo.membershipEndDate).getTime() - new Date(membershipInfo.originalEndDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
            )}

            {/* Total Duration Info */}
            <div className="mt-4 p-3 bg-content2 rounded-lg text-center">
              <p className="text-xs text-foreground-500">
                Total membership duration: {membershipInfo.membershipDuration} days
                ({Math.round((membershipInfo.membershipDuration || 0) / 30 * 10) / 10} months)
              </p>
            </div>
            </>
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

      {/* Membership History Modal */}
      <BottomSheet
        isOpen={isHistoryOpen}
        onClose={onHistoryClose}
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
                        <div className={`flex items-center gap-2 text-sm ${log.changeType === 'EXTENSION' ? 'p-2 bg-success/10 rounded-lg border border-success/20' : ''}`}>
                          <span className="text-foreground-600">Duration:</span>
                          <span className="text-foreground-400">{log.previousDuration || 0} days</span>
                          <span className="text-foreground-400">→</span>
                          <span className={`font-medium ${log.changeType === 'EXTENSION' ? 'text-success' : 'text-foreground-700'}`}>
                            {log.newDuration} days
                          </span>
                          {log.changeType === 'EXTENSION' && (
                            <Chip size="sm" color="success" variant="flat" className="ml-2">
                              +{(log.newDuration || 0) - (log.previousDuration || 0)} days
                            </Chip>
                          )}
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

      {/* Extend Membership Modal */}
      <BottomSheet
        isOpen={isExtendOpen}
        onClose={onExtendClose}
        title="Extend Membership"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onPress={onExtendClose}>
              Cancel
            </Button>
            <Button
              color="success"
              onPress={handleExtendMembership}
              isLoading={extending}
              startContent={<IconPlus size={16} />}
            >
              Extend Membership
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Current Membership Info */}
          {membershipInfo && (
            <div className="p-4 bg-content2 rounded-lg">
              <h4 className="font-medium mb-2">Current Membership</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-foreground-500">Current Duration</p>
                  <p className="font-medium">{membershipInfo.membershipDuration} days</p>
                </div>
                <div>
                  <p className="text-foreground-500">End Date</p>
                  <p className="font-medium">
                    {new Date(membershipInfo.membershipEndDate!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Extension Type */}
          <Select
            label="Extension Type"
            placeholder="Select extension type"
            value={extensionType}
            onChange={(e) => setExtensionType(e.target.value)}
          >
            <SelectItem key="DAYS" value="DAYS">
              Days
            </SelectItem>
            <SelectItem key="WEEKS" value="WEEKS">
              Weeks
            </SelectItem>
            <SelectItem key="MONTHS" value="MONTHS">
              Months
            </SelectItem>
          </Select>

          {/* Extension Value */}
          <Input
            type="number"
            label="Extension Value"
            placeholder={`Enter number of ${extensionType.toLowerCase()}`}
            value={extensionValue}
            onChange={(e) => setExtensionValue(e.target.value)}
            min="1"
            description={`How many ${extensionType.toLowerCase()} to extend the membership`}
          />

          {/* Quick Extension Presets */}
          <div>
            <p className="text-sm font-medium mb-3">Quick Extensions:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setExtensionType("DAYS");
                  setExtensionValue("30");
                }}
              >
                +30 Days
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setExtensionType("DAYS");
                  setExtensionValue("60");
                }}
              >
                +60 Days
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setExtensionType("MONTHS");
                  setExtensionValue("3");
                }}
              >
                +3 Months
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setExtensionType("MONTHS");
                  setExtensionValue("6");
                }}
              >
                +6 Months
              </Button>
            </div>
          </div>

          {/* Extension Reason */}
          <Textarea
            label="Reason (Optional)"
            placeholder="Enter reason for extension..."
            value={extensionReason}
            onChange={(e) => setExtensionReason(e.target.value)}
            maxRows={3}
          />

          {/* Preview */}
          {extensionValue && membershipInfo && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <h4 className="font-medium text-success mb-2">Extension Preview:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-foreground-500">Current Duration</p>
                  <p className="font-medium">{membershipInfo.membershipDuration} days</p>
                </div>
                <div>
                  <p className="text-foreground-500">After Extension</p>
                  <p className="font-medium text-success">
                    {(membershipInfo.membershipDuration || 0) +
                     (extensionType === 'DAYS' ? parseInt(extensionValue) :
                      extensionType === 'WEEKS' ? parseInt(extensionValue) * 7 :
                      parseInt(extensionValue) * 30)} days
                  </p>
                </div>
                <div>
                  <p className="text-foreground-500">Current End Date</p>
                  <p className="font-medium">
                    {new Date(membershipInfo.membershipEndDate!).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-500">New End Date</p>
                  <p className="font-medium text-success">
                    {(() => {
                      const currentEnd = new Date(membershipInfo.membershipEndDate!);
                      const extensionDays = extensionType === 'DAYS' ? parseInt(extensionValue) :
                                          extensionType === 'WEEKS' ? parseInt(extensionValue) * 7 :
                                          parseInt(extensionValue) * 30;
                      const newEnd = new Date(currentEnd);
                      newEnd.setDate(newEnd.getDate() + extensionDays);
                      return newEnd.toLocaleDateString();
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}