"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import {
  IconCreditCard,
  IconHistory,
  IconCurrencyRupee,
  IconAlertCircle,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";

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
  recordedBy?: string;
  recordedByName?: string;
  createdAt: string;
}

export default function PaymentInfo() {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Bottom sheet for payment history
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo(data.paymentInfo || {});
        setPaymentLogs(data.paymentLogs || []);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
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

  // Don't show the card if no payment data is available
  if (!paymentInfo.discountedPrice && paymentLogs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Payment Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconCreditCard size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payment Information</h3>
              <p className="text-sm text-foreground-500">Your membership payment details</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {paymentInfo.discountedPrice ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Package Price */}
                {paymentInfo.packagePrice && (
                  <div className="p-4 bg-content2 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconCurrencyRupee size={16} className="text-foreground-500" />
                      <span className="text-sm text-foreground-500">Package Price</span>
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(paymentInfo.packagePrice)}</p>
                  </div>
                )}

                {/* Discounted Price */}
                <div className="p-4 bg-content2 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IconCurrencyRupee size={16} className="text-foreground-500" />
                    <span className="text-sm text-foreground-500">Your Price</span>
                  </div>
                  <p className="text-xl font-bold text-primary">{formatCurrency(paymentInfo.discountedPrice)}</p>
                </div>

                {/* Amount Paid */}
                <div className="p-4 bg-content2 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IconCircleCheck size={16} className="text-success" />
                    <span className="text-sm text-foreground-500">Amount Paid</span>
                  </div>
                  <p className="text-xl font-bold text-success">{formatCurrency(paymentInfo.totalAmountPaid)}</p>
                </div>

                {/* Remaining Amount */}
                <div className="p-4 bg-content2 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IconAlertCircle size={16} className="text-warning" />
                    <span className="text-sm text-foreground-500">Remaining</span>
                  </div>
                  <p className="text-xl font-bold text-warning">{formatCurrency(paymentInfo.remainingAmount)}</p>
                </div>
              </div>

              {/* Payment Status & Next Due */}
              <Divider className="my-4" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Chip color={paymentStatus.color as any} variant="flat">
                    {paymentStatus.text}
                  </Chip>
                  {paymentInfo.nextPaymentDue && (
                    <div className="flex items-center gap-2 text-sm text-foreground-500">
                      <IconClock size={16} />
                      <span>Next due: {new Date(paymentInfo.nextPaymentDue).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {paymentInfo.paymentNotes && (
                  <div className="text-sm text-foreground-500 bg-content1 p-2 rounded">
                    <strong>Notes:</strong> {paymentInfo.paymentNotes}
                  </div>
                )}
              </div>

              {/* Payment History Button */}
              {paymentLogs.length > 0 && (
                <>
                  <Divider className="my-4" />
                  <div className="flex justify-center">
                    <Button
                      variant="flat"
                      color="secondary"
                      startContent={<IconHistory size={16} />}
                      onPress={onHistoryOpen}
                    >
                      View Payment History ({paymentLogs.length} payments)
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-content2 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <IconCreditCard size={32} className="text-foreground-400" />
              </div>
              <h4 className="text-lg font-medium mb-2">No Payment Plan Set</h4>
              <p className="text-foreground-500">Contact your admin to set up your payment plan.</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment History Bottom Sheet */}
      <BottomSheet
        isOpen={isHistoryOpen}
        onClose={onHistoryClose}
        title="Payment History"
        subtitle="Your recorded payments"
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
                      <Chip size="sm" variant="flat" color="secondary">
                        {log.paymentMethod}
                      </Chip>
                    </div>

                    {log.transactionId && (
                      <div className="mb-2">
                        <p className="text-xs text-foreground-400">Transaction ID</p>
                        <p className="text-sm font-mono">{log.transactionId}</p>
                      </div>
                    )}

                    {log.notes && (
                      <div className="mb-2">
                        <p className="text-xs text-foreground-400">Notes</p>
                        <p className="text-sm">{log.notes}</p>
                      </div>
                    )}

                    <div className="text-xs text-foreground-300 text-right">
                      Recorded: {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}