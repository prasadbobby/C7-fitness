"use client";

import { useState } from "react";
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
  Divider,
  Tabs,
  Tab,
  Switch,
} from "@nextui-org/react";
import {
  IconCreditCard,
  IconPlus,
  IconCalculator,
  IconCalendar,
  IconPause,
  IconPlayerPlay,
  IconRefresh,
  IconTrash,
  IconCheck,
  IconX,
  IconCurrency,
  IconAlertTriangle,
  IconGift,
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";
import DatePicker from "@/components/UI/DatePicker";
import { toast } from "sonner";

interface AdvancedPaymentManagerProps {
  userId: string;
  userInfo: {
    id: string;
    username?: string;
    firstName?: string;
    email?: string;
    membershipStartDate?: string;
    membershipEndDate?: string;
    discountedPrice?: number;
    totalAmountPaid?: number;
    remainingAmount?: number;
  };
}

export default function AdvancedPaymentManager({ userId, userInfo }: AdvancedPaymentManagerProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("prorata");

  // Pro-rata calculation state
  const [proRataResult, setProRataResult] = useState<any>(null);

  // Partial payment state
  const [partialAmount, setPartialAmount] = useState("");
  const [upfrontAmount, setUpfrontAmount] = useState("");
  const [installmentDays, setInstallmentDays] = useState("10");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Early renewal state
  const [renewalAmount, setRenewalAmount] = useState("");
  const [renewalDuration, setRenewalDuration] = useState("90");
  const [earlyDiscount, setEarlyDiscount] = useState("0");

  // Pause/Resume state
  const [pauseStartDate, setPauseStartDate] = useState<Date>(new Date());
  const [pauseEndDate, setPauseEndDate] = useState<Date | undefined>(undefined);
  const [pauseReason, setPauseReason] = useState("");
  const [adjustEndDate, setAdjustEndDate] = useState(true);

  // Refund state
  const [cancellationDate, setCancellationDate] = useState<Date>(new Date());
  const [cancellationReason, setCancellationReason] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("PROPORTIONAL");
  const [refundResult, setRefundResult] = useState<any>(null);

  // Extension state
  const [extensionDays, setExtensionDays] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [isComplementary, setIsComplementary] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const calculateProRata = async () => {
    if (!userInfo.membershipStartDate || !userInfo.membershipEndDate || !userInfo.discountedPrice) {
      toast.error("Missing membership or pricing information");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CALCULATE_PRORATA',
          data: {
            startDate: userInfo.membershipStartDate,
            endDate: userInfo.membershipEndDate,
            totalAmount: userInfo.discountedPrice,
            discountAmount: 0
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProRataResult(result.calculation);
        toast.success("Pro-rata calculation completed");
      } else {
        toast.error("Failed to calculate pro-rata breakdown");
      }
    } catch (error) {
      toast.error("Error calculating pro-rata breakdown");
    } finally {
      setLoading(false);
    }
  };

  const processPartialPayment = async () => {
    if (!partialAmount || !upfrontAmount || !paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    const total = parseFloat(partialAmount);
    const upfront = parseFloat(upfrontAmount);

    if (upfront >= total) {
      toast.error("Upfront amount cannot be greater than or equal to total amount");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_PARTIAL_PAYMENT',
          data: {
            userInfoId: userInfo.id,
            totalAmount: total,
            upfrontAmount: upfront,
            installmentDays: parseInt(installmentDays),
            paymentMethod,
            notes: `Partial payment: ₹${upfront} upfront, ₹${total - upfront} due in ${installmentDays} days`
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Partial payment processed! Payment plan: ${result.paymentPlan.paymentSchedule}`);
        onClose();
        // Refresh the page or update state
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process partial payment");
      }
    } catch (error) {
      toast.error("Error processing partial payment");
    } finally {
      setLoading(false);
    }
  };

  const processEarlyRenewal = async () => {
    if (!renewalAmount || !renewalDuration) {
      toast.error("Please fill in renewal amount and duration");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_EARLY_RENEWAL',
          data: {
            userInfoId: userInfo.id,
            renewalAmount: parseFloat(renewalAmount),
            newDurationDays: parseInt(renewalDuration),
            paymentMethod: "CASH",
            earlyDiscountPercent: parseFloat(earlyDiscount),
            notes: "Early renewal processed from admin panel"
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Early renewal processed! ${result.renewalCalculation.isAdvancePayment ? 'Advance payment recorded.' : 'Regular renewal processed.'}`);
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process early renewal");
      }
    } catch (error) {
      toast.error("Error processing early renewal");
    } finally {
      setLoading(false);
    }
  };

  const processMembershipPause = async () => {
    if (!pauseStartDate || !pauseReason) {
      toast.error("Please fill in pause start date and reason");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_MEMBERSHIP_PAUSE',
          data: {
            userInfoId: userInfo.id,
            pauseStartDate: pauseStartDate.toISOString(),
            pauseEndDate: pauseEndDate?.toISOString(),
            pauseReason,
            adjustEndDate
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Membership paused successfully! ${adjustEndDate ? `End date extended by ${result.pauseCalculation.pauseDays} days.` : 'No adjustment to end date.'}`);
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to pause membership");
      }
    } catch (error) {
      toast.error("Error pausing membership");
    } finally {
      setLoading(false);
    }
  };

  const calculateRefund = async () => {
    if (!cancellationDate || !cancellationReason) {
      toast.error("Please fill in cancellation date and reason");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CALCULATE_REFUND',
          data: {
            userInfoId: userInfo.id,
            cancellationDate: cancellationDate.toISOString(),
            refundPolicyType: refundPolicy
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRefundResult(result.refundCalculation);
        toast.success("Refund calculation completed");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to calculate refund");
      }
    } catch (error) {
      toast.error("Error calculating refund");
    } finally {
      setLoading(false);
    }
  };

  const processComplementaryExtension = async () => {
    if (!extensionDays || !extensionReason) {
      toast.error("Please fill in extension days and reason");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_COMPLEMENTARY_EXTENSION',
          data: {
            userInfoId: userInfo.id,
            extensionDays: parseInt(extensionDays),
            reason: extensionReason
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Complementary extension of ${extensionDays} days processed successfully!`);
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process extension");
      }
    } catch (error) {
      toast.error("Error processing extension");
    } finally {
      setLoading(false);
    }
  };

  const processCancellation = async () => {
    if (!cancellationDate || !cancellationReason || !refundResult) {
      toast.error("Please calculate refund first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_MEMBERSHIP_CANCELLATION',
          data: {
            userInfoId: userInfo.id,
            cancellationDate: cancellationDate.toISOString(),
            cancellationReason,
            refundPolicyType: refundPolicy,
            processRefund: refundResult.netRefund > 0
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Membership cancelled successfully! ${result.refundCalculation.netRefund > 0 ? `Refund of ₹${result.refundCalculation.netRefund.toFixed(2)} processed.` : 'No refund processed.'}`);
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process cancellation");
      }
    } catch (error) {
      toast.error("Error processing cancellation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconCalculator size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Advanced Payment Management</h3>
              <p className="text-sm text-foreground-500">
                Handle complex payment scenarios for {userInfo.firstName || userInfo.username || userInfo.email}
              </p>
            </div>
          </div>
          <Button
            color="primary"
            startContent={<IconPlus size={16} />}
            onPress={onOpen}
          >
            Advanced Actions
          </Button>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-content2 rounded-lg text-center">
              <IconCurrency size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-foreground-500">Total Paid</p>
              <p className="text-sm font-bold">₹{(userInfo.totalAmountPaid || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-content2 rounded-lg text-center">
              <IconAlertTriangle size={20} className="text-warning mx-auto mb-1" />
              <p className="text-xs text-foreground-500">Remaining</p>
              <p className="text-sm font-bold">₹{(userInfo.remainingAmount || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-content2 rounded-lg text-center">
              <IconCalendar size={20} className="text-success mx-auto mb-1" />
              <p className="text-xs text-foreground-500">Start Date</p>
              <p className="text-sm font-bold">
                {userInfo.membershipStartDate ? new Date(userInfo.membershipStartDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div className="p-3 bg-content2 rounded-lg text-center">
              <IconCalendar size={20} className="text-danger mx-auto mb-1" />
              <p className="text-xs text-foreground-500">End Date</p>
              <p className="text-sm font-bold">
                {userInfo.membershipEndDate ? new Date(userInfo.membershipEndDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Advanced Payment Actions"
        size="3xl"
      >
        <div className="space-y-6">
          <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
            <Tab key="prorata" title="Pro-rata Analysis">
              <div className="space-y-4">
                <p className="text-sm text-foreground-500">
                  Calculate month-wise revenue distribution for cross-month memberships
                </p>

                <Button
                  color="primary"
                  startContent={<IconCalculator size={16} />}
                  onPress={calculateProRata}
                  isLoading={loading}
                  isDisabled={!userInfo.membershipStartDate || !userInfo.membershipEndDate}
                >
                  Calculate Pro-rata Breakdown
                </Button>

                {proRataResult && (
                  <Card>
                    <CardHeader>
                      <h4 className="font-semibold">Pro-rata Revenue Distribution</h4>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Total Amount:</strong> ₹{proRataResult.totalAmount.toFixed(2)}</p>
                        <p className="text-sm"><strong>Daily Rate:</strong> ₹{proRataResult.dailyRate.toFixed(2)}</p>
                        <Divider className="my-3" />
                        <h5 className="font-medium">Monthly Breakdown:</h5>
                        {proRataResult.monthlyBreakdown.map((month: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm p-2 bg-content2 rounded">
                            <span>{month.month}</span>
                            <span>₹{month.amount.toFixed(2)} ({month.daysCount} days, {month.percentage.toFixed(1)}%)</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>

            <Tab key="partial" title="Partial Payment">
              <div className="space-y-4">
                <p className="text-sm text-foreground-500">
                  Set up installment-based payment plan with upfront amount and remaining balance
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Total Amount (₹)"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="15000"
                  />
                  <Input
                    type="number"
                    label="Upfront Payment (₹)"
                    value={upfrontAmount}
                    onChange={(e) => setUpfrontAmount(e.target.value)}
                    placeholder="10000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Due in Days"
                    value={installmentDays}
                    onChange={(e) => setInstallmentDays(e.target.value)}
                    placeholder="10"
                  />
                  <Select
                    label="Payment Method"
                    selectedKeys={paymentMethod ? [paymentMethod] : []}
                    onSelectionChange={(keys) => setPaymentMethod(Array.from(keys)[0] as string)}
                  >
                    <SelectItem key="CASH" value="CASH">Cash</SelectItem>
                    <SelectItem key="UPI" value="UPI">UPI</SelectItem>
                    <SelectItem key="CARD" value="CARD">Card</SelectItem>
                    <SelectItem key="ONLINE" value="ONLINE">Online</SelectItem>
                  </Select>
                </div>

                {partialAmount && upfrontAmount && (
                  <Card className="bg-warning-50 border-warning-200">
                    <CardBody>
                      <h5 className="font-medium text-warning-700 mb-2">Payment Plan Preview:</h5>
                      <p className="text-sm">Total: ₹{partialAmount}</p>
                      <p className="text-sm">Upfront: ₹{upfrontAmount}</p>
                      <p className="text-sm">Remaining: ₹{parseFloat(partialAmount) - parseFloat(upfrontAmount)} (due in {installmentDays} days)</p>
                    </CardBody>
                  </Card>
                )}

                <Button
                  color="primary"
                  startContent={<IconCreditCard size={16} />}
                  onPress={processPartialPayment}
                  isLoading={loading}
                  isDisabled={!partialAmount || !upfrontAmount || !paymentMethod}
                >
                  Process Partial Payment
                </Button>
              </div>
            </Tab>

            <Tab key="renewal" title="Early Renewal">
              <div className="space-y-4">
                <p className="text-sm text-foreground-500">
                  Process early membership renewal with advance payment handling
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Renewal Amount (₹)"
                    value={renewalAmount}
                    onChange={(e) => setRenewalAmount(e.target.value)}
                    placeholder="45000"
                  />
                  <Input
                    type="number"
                    label="Duration (Days)"
                    value={renewalDuration}
                    onChange={(e) => setRenewalDuration(e.target.value)}
                    placeholder="90"
                  />
                </div>

                <Input
                  type="number"
                  label="Early Renewal Discount (%)"
                  value={earlyDiscount}
                  onChange={(e) => setEarlyDiscount(e.target.value)}
                  placeholder="0"
                  description="Optional discount for early renewal"
                />

                <Button
                  color="success"
                  startContent={<IconRefresh size={16} />}
                  onPress={processEarlyRenewal}
                  isLoading={loading}
                  isDisabled={!renewalAmount || !renewalDuration}
                >
                  Process Early Renewal
                </Button>
              </div>
            </Tab>

            <Tab key="pause" title="Pause/Freeze">
              <div className="space-y-4">
                <p className="text-sm text-foreground-500">
                  Temporarily pause membership with automatic date adjustments
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    label="Pause Start Date"
                    value={pauseStartDate}
                    onChange={setPauseStartDate}
                  />
                  <DatePicker
                    label="Pause End Date (Optional)"
                    value={pauseEndDate}
                    onChange={setPauseEndDate}
                  />
                </div>

                <Textarea
                  label="Pause Reason"
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="Vacation, illness, etc."
                />

                <Switch
                  isSelected={adjustEndDate}
                  onValueChange={setAdjustEndDate}
                >
                  Extend membership end date by pause duration
                </Switch>

                <Button
                  color="secondary"
                  startContent={<IconPause size={16} />}
                  onPress={processMembershipPause}
                  isLoading={loading}
                  isDisabled={!pauseStartDate || !pauseReason}
                >
                  Pause Membership
                </Button>
              </div>
            </Tab>

            <Tab key="refund" title="Refund & Cancel">
              <div className="space-y-4">
                <p className="text-sm text-foreground-500">
                  Calculate refunds and process membership cancellations
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    label="Cancellation Date"
                    value={cancellationDate}
                    onChange={setCancellationDate}
                  />
                  <Select
                    label="Refund Policy"
                    selectedKeys={[refundPolicy]}
                    onSelectionChange={(keys) => setRefundPolicy(Array.from(keys)[0] as string)}
                  >
                    <SelectItem key="PROPORTIONAL" value="PROPORTIONAL">Proportional (Pro-rata)</SelectItem>
                    <SelectItem key="POLICY_BASED" value="POLICY_BASED">Policy-based</SelectItem>
                    <SelectItem key="NO_REFUND" value="NO_REFUND">No Refund</SelectItem>
                  </Select>
                </div>

                <Textarea
                  label="Cancellation Reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                />

                <div className="flex gap-2">
                  <Button
                    color="warning"
                    startContent={<IconCalculator size={16} />}
                    onPress={calculateRefund}
                    isLoading={loading}
                    isDisabled={!cancellationDate || !cancellationReason}
                  >
                    Calculate Refund
                  </Button>

                  {refundResult && (
                    <Button
                      color="danger"
                      startContent={<IconX size={16} />}
                      onPress={processCancellation}
                      isLoading={loading}
                    >
                      Process Cancellation
                    </Button>
                  )}
                </div>

                {refundResult && (
                  <Card className="bg-danger-50 border-danger-200">
                    <CardHeader>
                      <h4 className="font-semibold text-danger-700">Refund Calculation</h4>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-2 text-sm">
                        <p><strong>Used Days:</strong> {refundResult.usedDays}</p>
                        <p><strong>Remaining Days:</strong> {refundResult.remainingDays}</p>
                        <p><strong>Used Amount:</strong> ₹{refundResult.usedAmount.toFixed(2)}</p>
                        <p><strong>Eligible Refund:</strong> ₹{refundResult.eligibleRefund.toFixed(2)}</p>
                        <p><strong>Processing Fee:</strong> ₹{(refundResult.processingFee || 0).toFixed(2)}</p>
                        <p className="text-lg font-bold text-danger-700">
                          <strong>Net Refund:</strong> ₹{refundResult.netRefund.toFixed(2)}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>

            <Tab key="extension" title="Complementary">
              <div className="space-y-4">
                <p className="text-sm text-foreground-500">
                  Provide complementary membership extensions (no additional payment)
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Extension Days"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(e.target.value)}
                    placeholder="30"
                  />
                  <div className="flex items-center gap-2 p-3">
                    <IconGift size={20} className="text-success" />
                    <span className="text-sm text-success font-medium">Complementary Extension</span>
                  </div>
                </div>

                <Textarea
                  label="Reason for Extension"
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Customer satisfaction, loyalty bonus, compensation, etc."
                />

                <Button
                  color="success"
                  startContent={<IconGift size={16} />}
                  onPress={processComplementaryExtension}
                  isLoading={loading}
                  isDisabled={!extensionDays || !extensionReason}
                >
                  Process Complementary Extension
                </Button>
              </div>
            </Tab>
          </Tabs>
        </div>
      </BottomSheet>
    </>
  );
}