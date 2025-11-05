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
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  useDisclosure,
  Divider,
} from "@nextui-org/react";
import {
  IconCreditCard,
  IconPlus,
  IconEdit,
  IconHistory,
  IconCurrencyRupee,
  IconAlertCircle,
  IconCircleCheck,
  IconClock,
  IconTrash,
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";
import DatePicker from "@/components/UI/DatePicker";
import { toast } from "sonner";

interface PaymentInfo {
  packagePrice?: number;
  discountedPrice?: number;
  totalAmountPaid?: number;
  remainingAmount?: number;
  nextPaymentDue?: string;
  paymentNotes?: string;
}

interface PaymentLog {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
}

interface PaymentManagerProps {
  userId: string;
  userInfo: {
    username?: string;
    firstName?: string;
    email?: string;
  };
}

const paymentMethods = [
  { key: "CASH", label: "Cash" },
  { key: "ONLINE", label: "Online" },
  { key: "CARD", label: "Card" },
  { key: "UPI", label: "UPI" },
  { key: "BANK_TRANSFER", label: "Bank Transfer" },
  { key: "CHEQUE", label: "Cheque" },
];

export default function PaymentManager({ userId, userInfo }: PaymentManagerProps) {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);

  // Pricing form state
  const [packagePrice, setPackagePrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [nextPaymentDue, setNextPaymentDue] = useState<Date | undefined>(undefined);
  const [paymentNotes, setPaymentNotes] = useState("");

  // Add payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [transactionId, setTransactionId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Modals
  const { isOpen: isPricingOpen, onOpen: onPricingOpen, onClose: onPricingClose } = useDisclosure();
  const { isOpen: isAddPaymentOpen, onOpen: onAddPaymentOpen, onClose: onAddPaymentClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();

  useEffect(() => {
    fetchPaymentData();
  }, [userId]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);

      // Fetch payment info and history
      const response = await fetch(`/api/admin/users/${userId}/payments`);
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo(data.paymentInfo || {});
        setPaymentLogs(data.paymentLogs || []);

        // Populate form with existing data
        if (data.paymentInfo) {
          setPackagePrice(data.paymentInfo.packagePrice?.toString() || "");
          setDiscountedPrice(data.paymentInfo.discountedPrice?.toString() || "");
          setPaymentNotes(data.paymentInfo.paymentNotes || "");
          if (data.paymentInfo.nextPaymentDue) {
            setNextPaymentDue(new Date(data.paymentInfo.nextPaymentDue));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
      toast.error("Failed to load payment information");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async () => {
    try {
      setSaving(true);

      const payload = {
        packagePrice: parseFloat(packagePrice) || null,
        discountedPrice: parseFloat(discountedPrice) || null,
        nextPaymentDue: nextPaymentDue?.toISOString() || null,
        paymentNotes: paymentNotes.trim() || null,
      };

      const response = await fetch(`/api/admin/users/${userId}/payments/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Payment pricing updated successfully");
        onPricingClose();
        fetchPaymentData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update payment pricing");
      }
    } catch (error) {
      console.error("Error updating payment pricing:", error);
      toast.error("Failed to update payment pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast.error("Please fill in amount and payment method");
      return;
    }

    try {
      setAddingPayment(true);

      const payload = {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        paymentDate: paymentDate.toISOString(),
        transactionId: transactionId.trim() || null,
        notes: paymentNote.trim() || null,
      };

      const response = await fetch(`/api/admin/users/${userId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Payment recorded successfully");
        onAddPaymentClose();
        resetAddPaymentForm();
        fetchPaymentData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setAddingPayment(false);
    }
  };

  const resetAddPaymentForm = () => {
    setPaymentAmount("");
    setPaymentMethod("");
    setPaymentDate(new Date());
    setTransactionId("");
    setPaymentNote("");
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getPaymentStatus = () => {
    if (!paymentInfo.discountedPrice || !paymentInfo.totalAmountPaid) {
      return { status: "no-pricing", color: "default", text: "No pricing set" };
    }

    const remaining = paymentInfo.remainingAmount || 0;
    if (remaining <= 0) {
      return { status: "paid", color: "success", text: "Fully Paid" };
    }

    if (paymentInfo.nextPaymentDue) {
      const dueDate = new Date(paymentInfo.nextPaymentDue);
      const today = new Date();
      if (dueDate < today) {
        return { status: "overdue", color: "danger", text: "Payment Overdue" };
      }
    }

    return { status: "pending", color: "warning", text: "Pending Payment" };
  };

  const paymentStatus = getPaymentStatus();

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading payment information...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Overview Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconCreditCard size={24} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold">Payment Tracking</h3>
              <p className="text-sm text-foreground-500 truncate">
                Manage membership payments for {userInfo.firstName || userInfo.username || userInfo.email}
              </p>
            </div>
          </div>

          {/* Mobile: Stacked buttons */}
          <div className="flex flex-col gap-2 sm:hidden w-full">
            {paymentLogs.length > 0 && (
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<IconHistory size={16} />}
                onPress={onHistoryOpen}
                className="w-full justify-start"
              >
                Payment History ({paymentLogs.length})
              </Button>
            )}
            <Button
              size="sm"
              variant="flat"
              startContent={<IconEdit size={16} />}
              onPress={onPricingOpen}
              className="w-full justify-start"
            >
              Setup Pricing
            </Button>
            <Button
              size="sm"
              color="primary"
              startContent={<IconPlus size={16} />}
              onPress={onAddPaymentOpen}
              isDisabled={!paymentInfo.discountedPrice}
              className="w-full justify-start"
            >
              Add Payment
            </Button>
          </div>

          {/* Desktop: Horizontal buttons */}
          <div className="hidden sm:flex gap-2 flex-wrap">
            {paymentLogs.length > 0 && (
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<IconHistory size={16} />}
                onPress={onHistoryOpen}
              >
                History ({paymentLogs.length})
              </Button>
            )}
            <Button
              size="sm"
              variant="flat"
              startContent={<IconEdit size={16} />}
              onPress={onPricingOpen}
            >
              Setup Pricing
            </Button>
            <Button
              size="sm"
              color="primary"
              startContent={<IconPlus size={16} />}
              onPress={onAddPaymentOpen}
              isDisabled={!paymentInfo.discountedPrice}
            >
              Add Payment
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Package Price */}
            <div className="p-3 sm:p-4 bg-content2 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                <IconCurrencyRupee size={14} className="text-foreground-500 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm text-foreground-500 truncate">Package Price</span>
              </div>
              <p className="text-lg sm:text-xl font-bold truncate">{formatCurrency(paymentInfo.packagePrice)}</p>
            </div>

            {/* Discounted Price */}
            <div className="p-3 sm:p-4 bg-content2 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                <IconCurrencyRupee size={14} className="text-foreground-500 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm text-foreground-500 truncate">Final Price</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-primary truncate">{formatCurrency(paymentInfo.discountedPrice)}</p>
            </div>

            {/* Amount Paid */}
            <div className="p-3 sm:p-4 bg-content2 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                <IconCircleCheck size={14} className="text-success sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm text-foreground-500 truncate">Amount Paid</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-success truncate">{formatCurrency(paymentInfo.totalAmountPaid)}</p>
            </div>

            {/* Remaining Amount */}
            <div className="p-3 sm:p-4 bg-content2 rounded-lg">
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                <IconAlertCircle size={14} className="text-warning sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm text-foreground-500 truncate">Remaining</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-warning truncate">{formatCurrency(paymentInfo.remainingAmount)}</p>
            </div>
          </div>

          {/* Payment Status & Next Due */}
          <Divider className="my-4" />

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <Chip color={paymentStatus.color as any} variant="flat" size="sm">
                  {paymentStatus.text}
                </Chip>
                {paymentInfo.nextPaymentDue && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground-500">
                    <IconClock size={14} className="sm:w-4 sm:h-4" />
                    <span>Next due: {new Date(paymentInfo.nextPaymentDue).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {paymentInfo.paymentNotes && (
              <div className="text-xs sm:text-sm text-foreground-500 bg-content1 p-2 sm:p-3 rounded">
                <strong>Notes:</strong> {paymentInfo.paymentNotes}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Payment History Bottom Sheet */}
      <BottomSheet
        isOpen={isHistoryOpen}
        onClose={onHistoryClose}
        title="Payment History"
      >
        <div className="space-y-4">
          {paymentLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-content2 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <IconHistory size={32} className="text-foreground-400" />
              </div>
              <h4 className="text-lg font-medium mb-2">No Payment Records</h4>
              <p className="text-foreground-500">No payments have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentLogs.map((log) => (
                <Card key={log.id} shadow="none" className="border border-divider">
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-lg font-bold text-success">{formatCurrency(log.amount)}</p>
                        <p className="text-sm text-foreground-500">
                          {new Date(log.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Chip size="sm" variant="flat" color="secondary">
                          {log.paymentMethod}
                        </Chip>
                        <p className="text-xs text-foreground-400 mt-1">
                          by {log.recordedByName || log.recordedBy}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {log.transactionId && (
                        <div>
                          <p className="text-xs text-foreground-400">Transaction ID</p>
                          <p className="text-sm font-mono">{log.transactionId}</p>
                        </div>
                      )}

                      {log.notes && (
                        <div>
                          <p className="text-xs text-foreground-400">Notes</p>
                          <p className="text-sm">{log.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-foreground-300 text-right mt-3 pt-2 border-t border-divider">
                      Recorded: {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Setup Pricing Modal */}
      <BottomSheet
        isOpen={isPricingOpen}
        onClose={onPricingClose}
        title="Setup Payment Pricing"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onPress={onPricingClose} className="flex-1">
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSavePricing}
              isLoading={saving}
              className="flex-1"
            >
              Save Pricing
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Package Price (₹)"
              placeholder="45000"
              value={packagePrice}
              onChange={(e) => setPackagePrice(e.target.value)}
              description="Original package price"
            />
            <Input
              type="number"
              label="Final Price (₹)"
              placeholder="40000"
              value={discountedPrice}
              onChange={(e) => setDiscountedPrice(e.target.value)}
              description="Actual price offered to user"
            />
          </div>

          <DatePicker
            label="Next Payment Due Date"
            value={nextPaymentDue}
            onChange={setNextPaymentDue}
          />

          <Input
            label="Payment Notes"
            placeholder="Special payment arrangements or notes..."
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            description="Optional notes about payment arrangements"
          />
        </div>
      </BottomSheet>

      {/* Add Payment Modal */}
      <BottomSheet
        isOpen={isAddPaymentOpen}
        onClose={onAddPaymentClose}
        title="Record Payment"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onPress={onAddPaymentClose} className="flex-1">
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAddPayment}
              isLoading={addingPayment}
              className="flex-1"
            >
              Record Payment
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Payment Amount (₹)"
              placeholder="20000"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              isRequired
            />
            <Select
              label="Payment Method"
              placeholder="Select method"
              selectedKeys={paymentMethod ? [paymentMethod] : []}
              onSelectionChange={(keys) => setPaymentMethod(Array.from(keys)[0] as string)}
              isRequired
            >
              {paymentMethods.map((method) => (
                <SelectItem key={method.key} value={method.key}>
                  {method.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <DatePicker
            label="Payment Date"
            value={paymentDate}
            onChange={(date) => setPaymentDate(date || new Date())}
          />

          <Input
            label="Transaction ID"
            placeholder="Optional transaction reference"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            description="For online payments or reference numbers"
          />

          <Input
            label="Notes"
            placeholder="Additional notes about this payment..."
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            description="Optional notes"
          />
        </div>
      </BottomSheet>
    </div>
  );
}