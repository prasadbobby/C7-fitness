"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Avatar,
  Pagination,
  useDisclosure,
  Tooltip,
} from "@nextui-org/react";
import {
  IconCreditCard,
  IconUsers,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconSearch,
  IconEye,
  IconCash,
  IconDeviceDesktop,
  IconCreditCardPay,
  IconBrandPaypal,
  IconBuildingBank,
  IconFileText,
  IconCalendarDue,
  IconCurrency,
  IconTrendingUp,
  IconTrendingDown,
  IconPlus,
  IconEdit,
  IconHistory,
  IconCurrencyRupee,
  IconAlertCircle,
  IconCircleCheck,
  IconDeviceFloppy,
  IconKey,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import BottomSheet from "@/components/UI/BottomSheet";
import SuperAdminAuthModal from "@/components/SuperAdminAuthModal";
import DatePicker from "@/components/UI/DatePicker";
import { toast } from "sonner";

interface PaymentLog {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string | null;
  notes: string | null;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

interface PaymentUser {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImageUrl: string;
  packagePrice: number | null;
  discountedPrice: number | null;
  totalAmountPaid: number;
  remainingAmount: number;
  nextPaymentDue: string | null;
  paymentNotes: string | null;
  paymentStatus: 'no_pricing' | 'fully_paid' | 'pending' | 'overdue';
  recentPayments: PaymentLog[];
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalUsers: number;
  usersWithPricing: number;
  usersFullyPaid: number;
  usersOverdue: number;
  totalRevenue: number;
  totalPending: number;
}

const paymentMethods = [
  { key: "CASH", label: "Cash" },
  { key: "ONLINE", label: "Online" },
  { key: "CARD", label: "Card" },
  { key: "UPI", label: "UPI" },
  { key: "BANK_TRANSFER", label: "Bank Transfer" },
  { key: "CHEQUE", label: "Cheque" },
];

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'CASH':
      return IconCash;
    case 'ONLINE':
      return IconDeviceDesktop;
    case 'CARD':
      return IconCreditCardPay;
    case 'UPI':
      return IconBrandPaypal;
    case 'BANK_TRANSFER':
      return IconBuildingBank;
    case 'CHEQUE':
      return IconFileText;
    default:
      return IconCreditCard;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'fully_paid':
      return 'success';
    case 'pending':
      return 'primary';
    case 'overdue':
      return 'danger';
    case 'no_pricing':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'fully_paid':
      return 'Fully Paid';
    case 'pending':
      return 'Pending';
    case 'overdue':
      return 'Overdue';
    case 'no_pricing':
      return 'No Pricing';
    default:
      return 'Unknown';
  }
};

export default function PaymentInfoPage() {
  const [users, setUsers] = useState<PaymentUser[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<PaymentUser | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Payment management state
  const [allPaymentLogs, setAllPaymentLogs] = useState<PaymentLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);

  // Pricing form state
  const [packagePrice, setPackagePrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Next payment due state (for main modal)
  const [nextPaymentDue, setNextPaymentDue] = useState<Date | undefined>(undefined);
  const [updatingDueDate, setUpdatingDueDate] = useState(false);

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
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  const { isOpen: isEditPaymentOpen, onOpen: onEditPaymentOpen, onClose: onEditPaymentClose } = useDisclosure();

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Edit payment state
  const [editingPayment, setEditingPayment] = useState<PaymentLog | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState<Date>(new Date());
  const [editTransactionId, setEditTransactionId] = useState("");
  const [editPaymentNote, setEditPaymentNote] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Super Admin Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);

  // Force refresh key for modal components
  const [modalRefreshKey, setModalRefreshKey] = useState(0);

  const forceModalRefresh = () => {
    setModalRefreshKey(prev => prev + 1);
  };
  const { isOpen: isAuthOpen, onOpen: onAuthOpen, onClose: onAuthClose } = useDisclosure();

  const limit = 20;

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentData();
    }
  }, [page, searchTerm, statusFilter, isAuthenticated]);

  useEffect(() => {
    if (showAuthModal) {
      onAuthOpen();
    }
  }, [showAuthModal, onAuthOpen]);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/paymentinfo?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Failed to fetch payment data');
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const openUserDetails = (user: PaymentUser) => {
    setSelectedUser(user);
    // Populate form with existing data
    setPackagePrice(user.packagePrice?.toString() || "");
    setDiscountedPrice(user.discountedPrice?.toString() || "");
    setPaymentNotes(user.paymentNotes || "");

    // Set next payment due date
    if (user.nextPaymentDue) {
      setNextPaymentDue(new Date(user.nextPaymentDue));
    } else {
      setNextPaymentDue(undefined);
    }
    fetchUserPaymentHistory(user.id);
    onOpen();
  };

  const fetchUserPaymentHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/payments`);
      if (response.ok) {
        const data = await response.json();
        setAllPaymentLogs(data.paymentLogs || []);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  const handleSavePricing = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      const payload = {
        packagePrice: parseFloat(packagePrice) || null,
        discountedPrice: parseFloat(discountedPrice) || null,
        paymentNotes: paymentNotes.trim() || null,
      };

      const response = await fetch(`/api/admin/users/${selectedUser.id}/payments/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedData = await response.json();
        toast.success("Payment pricing updated successfully");
        onPricingClose();

        // Update the selected user with the new data
        if (selectedUser && updatedData.paymentInfo) {
          const paymentInfo = updatedData.paymentInfo;

          // Calculate payment status using utility function
          const paymentStatus = calculatePaymentStatus(
            paymentInfo.discountedPrice,
            paymentInfo.totalAmountPaid,
            paymentInfo.remainingAmount,
            paymentInfo.nextPaymentDue
          );

          // Update selected user with new payment status
          const updatedUser = {
            ...selectedUser,
            packagePrice: paymentInfo.packagePrice,
            discountedPrice: paymentInfo.discountedPrice,
            totalAmountPaid: paymentInfo.totalAmountPaid,
            remainingAmount: paymentInfo.remainingAmount,
            nextPaymentDue: paymentInfo.nextPaymentDue,
            paymentNotes: paymentInfo.paymentNotes,
            paymentStatus: paymentStatus as any
          };

          setSelectedUser(updatedUser);
          forceModalRefresh(); // Force modal re-render
        }

        fetchPaymentData(); // Refresh the main data
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
    if (!selectedUser || !paymentAmount || !paymentMethod) {
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

      const response = await fetch(`/api/admin/users/${selectedUser.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedData = await response.json();
        toast.success("Payment recorded successfully");
        onAddPaymentClose();
        resetAddPaymentForm();

        // Update the selected user with the new payment data
        if (selectedUser && updatedData.paymentInfo) {
          const paymentInfo = updatedData.paymentInfo;

          // Calculate payment status using utility function
          const paymentStatus = calculatePaymentStatus(
            paymentInfo.discountedPrice,
            paymentInfo.totalAmountPaid,
            paymentInfo.remainingAmount,
            paymentInfo.nextPaymentDue
          );

          // Update recent payments (add new payment to the beginning)
          let updatedRecentPayments = selectedUser.recentPayments;

          if (updatedData.newPayment) {
            // Add the new payment returned from the API to the beginning
            updatedRecentPayments = [updatedData.newPayment, ...selectedUser.recentPayments].slice(0, 3); // Keep only latest 3
          }

          // Update selected user with new payment status and recent payments
          const updatedUser = {
            ...selectedUser,
            packagePrice: paymentInfo.packagePrice,
            discountedPrice: paymentInfo.discountedPrice,
            totalAmountPaid: paymentInfo.totalAmountPaid,
            remainingAmount: paymentInfo.remainingAmount,
            nextPaymentDue: paymentInfo.nextPaymentDue,
            paymentNotes: paymentInfo.paymentNotes,
            paymentStatus: paymentStatus as any,
            recentPayments: updatedRecentPayments
          };

          setSelectedUser(updatedUser);
          forceModalRefresh(); // Force modal re-render
        }

        fetchPaymentData(); // Refresh the main data
        fetchUserPaymentHistory(selectedUser.id); // Refresh user payment history
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

  const handleUpdateDueDate = async (newDate: Date | undefined) => {
    if (!selectedUser) return;

    try {
      setUpdatingDueDate(true);

      const response = await fetch(`/api/admin/users/${selectedUser.id}/payments/due-date`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextPaymentDue: newDate?.toISOString() || null,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setNextPaymentDue(newDate);

        // Recalculate payment status with new due date using utility function
        const paymentStatus = calculatePaymentStatus(
          selectedUser.discountedPrice,
          selectedUser.totalAmountPaid,
          selectedUser.remainingAmount,
          newDate?.toISOString() || null
        );

        // Update selected user with new due date and recalculated status
        const updatedUser = {
          ...selectedUser,
          nextPaymentDue: newDate?.toISOString() || null,
          paymentStatus: paymentStatus as any,
        };

        setSelectedUser(updatedUser);

        fetchPaymentData(); // Refresh the main data
        toast.success("Next payment due date updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update due date");
      }
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error("Failed to update due date");
    } finally {
      setUpdatingDueDate(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    onAuthClose();
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    try {
      setUpdatingPassword(true);

      const response = await fetch('/api/admin/super-admin-auth/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password updated successfully");
        onPasswordClose();
        resetPasswordForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const openEditPayment = (payment: PaymentLog) => {
    setEditingPayment(payment);
    setEditPaymentAmount(payment.amount.toString());
    setEditPaymentMethod(payment.paymentMethod);
    setEditPaymentDate(new Date(payment.paymentDate));
    setEditTransactionId(payment.transactionId || "");
    setEditPaymentNote(payment.notes || "");
    onEditPaymentOpen();
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment || !selectedUser || !editPaymentAmount || !editPaymentMethod) {
      toast.error("Please fill in amount and payment method");
      return;
    }

    try {
      setUpdatingPayment(true);

      const payload = {
        amount: parseFloat(editPaymentAmount),
        paymentMethod: editPaymentMethod,
        paymentDate: editPaymentDate.toISOString(),
        transactionId: editTransactionId.trim() || null,
        notes: editPaymentNote.trim() || null,
      };

      const response = await fetch(`/api/admin/users/${selectedUser.id}/payments/${editingPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedData = await response.json();
        toast.success("Payment updated successfully");
        onEditPaymentClose();
        resetEditPaymentForm();

        // Update the selected user with the new payment data if returned
        if (selectedUser && updatedData.paymentInfo) {
          const paymentInfo = updatedData.paymentInfo;

          // Calculate payment status using utility function
          const paymentStatus = calculatePaymentStatus(
            paymentInfo.discountedPrice,
            paymentInfo.totalAmountPaid,
            paymentInfo.remainingAmount,
            paymentInfo.nextPaymentDue
          );

          // Update selected user with new payment status
          const updatedUser = {
            ...selectedUser,
            packagePrice: paymentInfo.packagePrice,
            discountedPrice: paymentInfo.discountedPrice,
            totalAmountPaid: paymentInfo.totalAmountPaid,
            remainingAmount: paymentInfo.remainingAmount,
            nextPaymentDue: paymentInfo.nextPaymentDue,
            paymentNotes: paymentInfo.paymentNotes,
            paymentStatus: paymentStatus as any,
          };

          setSelectedUser(updatedUser);
          forceModalRefresh(); // Force modal re-render
        }

        fetchPaymentData(); // Refresh the main data
        fetchUserPaymentHistory(selectedUser.id); // Refresh user payment history
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update payment");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    } finally {
      setUpdatingPayment(false);
    }
  };

  const resetEditPaymentForm = () => {
    setEditingPayment(null);
    setEditPaymentAmount("");
    setEditPaymentMethod("");
    setEditPaymentDate(new Date());
    setEditTransactionId("");
    setEditPaymentNote("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Utility function to calculate payment status consistently
  const calculatePaymentStatus = (
    discountedPrice: number | null,
    totalAmountPaid: number | null,
    remainingAmount: number | null,
    nextPaymentDue: string | null
  ) => {
    let paymentStatus = 'no_pricing';
    if (discountedPrice && totalAmountPaid !== null) {
      const remaining = remainingAmount || 0;
      if (remaining <= 0) {
        paymentStatus = 'fully_paid';
      } else if (nextPaymentDue) {
        const dueDate = new Date(nextPaymentDue);
        const today = new Date();
        paymentStatus = dueDate < today ? 'overdue' : 'pending';
      } else {
        paymentStatus = 'pending';
      }
    }
    return paymentStatus;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: IconUsers,
      color: "primary" as const,
    },
    {
      title: "Users with Pricing",
      value: stats?.usersWithPricing || 0,
      icon: IconCreditCard,
      color: "secondary" as const,
    },
    {
      title: "Fully Paid",
      value: stats?.usersFullyPaid || 0,
      icon: IconCheck,
      color: "success" as const,
    },
    {
      title: "Overdue Payments",
      value: stats?.usersOverdue || 0,
      icon: IconAlertTriangle,
      color: "danger" as const,
    },
  ];

  // Show authentication modal if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="space-y-6">
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <IconCreditCard size={64} className="mx-auto text-foreground-300 mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Payment Dashboard</h2>
              <p className="text-foreground-500">
                Please authenticate to access the payment information system.
              </p>
            </div>
          </div>
        </div>

        <SuperAdminAuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            // Prevent closing without authentication
            return;
          }}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Dashboard</h1>
          <p className="text-foreground-500 mt-2">
            Monitor and manage all user payments and billing information.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            startContent={<IconKey size={16} />}
            onPress={onPasswordOpen}
          >
            Update Password
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-content1">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-500 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}/10`}>
                    <Icon size={24} className={`text-${stat.color}`} />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-content1">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-success">
                  {stats ? formatCurrency(stats.totalRevenue) : '₹0'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <IconTrendingUp size={24} className="text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-content1">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-500 mb-1">Pending Amount</p>
                <p className="text-2xl font-bold text-warning">
                  {stats ? formatCurrency(stats.totalPending) : '₹0'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <IconTrendingDown size={24} className="text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-content1">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by name, email, or notes..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              startContent={<IconSearch size={18} />}
              className="w-full sm:max-w-xs"
            />
            <Select
              placeholder="Filter by status"
              selectedKeys={[statusFilter]}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full sm:max-w-xs"
            >
              <SelectItem key="all" value="all">All Status</SelectItem>
              <SelectItem key="fully_paid" value="fully_paid">Fully Paid</SelectItem>
              <SelectItem key="pending" value="pending">Pending</SelectItem>
              <SelectItem key="overdue" value="overdue">Overdue</SelectItem>
              <SelectItem key="no_pricing" value="no_pricing">No Pricing</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Payment Table */}
      <Card className="bg-content1">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">User Payments</h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <Table
              aria-label="Payment information table"
              isStriped
            >
            <TableHeader>
              <TableColumn className="min-w-[60px]">S.NO</TableColumn>
              <TableColumn className="min-w-[200px]">USER</TableColumn>
              <TableColumn className="min-w-[120px]">PRICING</TableColumn>
              <TableColumn className="min-w-[100px]">PAID</TableColumn>
              <TableColumn className="min-w-[100px]">REMAINING</TableColumn>
              <TableColumn className="min-w-[100px]">STATUS</TableColumn>
              <TableColumn className="min-w-[120px]">NEXT DUE</TableColumn>
              <TableColumn className="min-w-[100px]">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={<div>Loading payment data...</div>}
            >
              {users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-medium text-foreground-600">
                        #{(page - 1) * limit + index + 1}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={user.userImageUrl} name={user.userName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground leading-tight mb-0">{user.userName}</p>
                        <p className="text-xs text-foreground-500 leading-tight mt-0.5">{user.userEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      {user.packagePrice && (
                        <p className="text-xs text-foreground-400 line-through leading-tight mb-0">
                          {formatCurrency(user.packagePrice)}
                        </p>
                      )}
                      <p className="font-medium text-foreground leading-tight mt-0.5">
                        {user.discountedPrice ? formatCurrency(user.discountedPrice) : 'Not set'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-success">
                      {formatCurrency(user.totalAmountPaid)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className={`font-medium ${user.remainingAmount > 0 ? 'text-warning' : 'text-success'}`}>
                      {formatCurrency(user.remainingAmount)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(user.paymentStatus)}
                      variant="flat"
                      size="sm"
                    >
                      {getStatusText(user.paymentStatus)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 min-w-0">
                      <IconCalendarDue size={14} className="text-foreground-400 flex-shrink-0" />
                      <span className="text-sm truncate">{formatDate(user.nextPaymentDue)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="View Details">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openUserDetails(user)}
                        >
                          <IconEye size={18} />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              showControls
              showShadow
            />
          </div>
        </CardBody>
      </Card>

      {/* User Details BottomSheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={selectedUser ? `${selectedUser.userName} - Payment Details` : "Payment Details"}
        size="2xl"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onPress={onClose} className="flex-1">
              Close
            </Button>
            {selectedUser && (
              <>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<IconEdit size={16} />}
                  onPress={onPricingOpen}
                  className="flex-1"
                >
                  Setup Pricing
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  startContent={<IconPlus size={16} />}
                  onPress={onAddPaymentOpen}
                  isDisabled={!selectedUser.discountedPrice}
                  className="flex-1"
                >
                  Add Payment
                </Button>
              </>
            )}
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Info Header */}
            <div className="flex items-center gap-3 p-4 bg-content2 rounded-lg">
              <Avatar src={selectedUser.userImageUrl} name={selectedUser.userName} size="md" />
              <div>
                <h3 className="text-lg font-semibold">{selectedUser.userName}</h3>
                <p className="text-sm text-foreground-500">{selectedUser.userEmail}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <Card key={`payment-summary-${modalRefreshKey}`} className="bg-content2">
              <CardHeader className="flex flex-row items-center justify-between">
                <h4 className="font-semibold">Payment Summary</h4>
                <div className="flex gap-2">
                  <Chip
                    key={`payment-status-${modalRefreshKey}`}
                    color={getStatusColor(selectedUser.paymentStatus)}
                    variant="flat"
                    size="sm"
                  >
                    {getStatusText(selectedUser.paymentStatus)}
                  </Chip>
                  {allPaymentLogs.length > 0 && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      startContent={<IconHistory size={16} />}
                      onPress={onHistoryOpen}
                    >
                      History ({allPaymentLogs.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Package Price */}
                  <div className="p-3 bg-content1 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconCurrencyRupee size={14} className="text-foreground-500" />
                      <span className="text-xs text-foreground-500">Package Price</span>
                    </div>
                    <p className="text-lg font-bold">
                      {selectedUser.packagePrice ? formatCurrency(selectedUser.packagePrice) : '₹0'}
                    </p>
                  </div>

                  {/* Final Price */}
                  <div className="p-3 bg-content1 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconCurrencyRupee size={14} className="text-foreground-500" />
                      <span className="text-xs text-foreground-500">Final Price</span>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {selectedUser.discountedPrice ? formatCurrency(selectedUser.discountedPrice) : '₹0'}
                    </p>
                  </div>

                  {/* Amount Paid */}
                  <div className="p-3 bg-content1 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconCircleCheck size={14} className="text-success" />
                      <span className="text-xs text-foreground-500">Amount Paid</span>
                    </div>
                    <p className="text-lg font-bold text-success">
                      {formatCurrency(selectedUser.totalAmountPaid)}
                    </p>
                  </div>

                  {/* Remaining Amount */}
                  <div className="p-3 bg-content1 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconAlertCircle size={14} className="text-warning" />
                      <span className="text-xs text-foreground-500">Remaining</span>
                    </div>
                    <p className={`text-lg font-bold ${selectedUser.remainingAmount > 0 ? 'text-warning' : 'text-success'}`}>
                      {formatCurrency(selectedUser.remainingAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-content1 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconClock size={16} className="text-foreground-500" />
                      <span className="text-sm text-foreground-500">Next Payment Due Date</span>
                    </div>
                  </div>
                  <DatePicker
                    value={nextPaymentDue}
                    onChange={(date) => {
                      setNextPaymentDue(date);
                      handleUpdateDueDate(date);
                    }}
                    placeholder="Set next payment due date"
                    disabled={updatingDueDate}
                  />
                  {updatingDueDate && (
                    <p className="text-xs text-foreground-400 mt-1">Updating...</p>
                  )}
                </div>

                {selectedUser.paymentNotes && (
                  <div className="mt-4 p-3 bg-content1 rounded-lg">
                    <p className="text-xs text-foreground-500 mb-1">Payment Notes</p>
                    <p className="text-sm">{selectedUser.paymentNotes}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Payments */}
            <div>
              <h4 className="font-semibold mb-3">Recent Payments</h4>
              {selectedUser.recentPayments.length > 0 ? (
                <div className="space-y-3">
                  {selectedUser.recentPayments.map((payment) => {
                    const MethodIcon = getPaymentMethodIcon(payment.paymentMethod);
                    return (
                      <Card key={payment.id} className="bg-content2">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <MethodIcon size={16} className="text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                <p className="text-xs text-foreground-500">
                                  {payment.paymentMethod} • {formatDate(payment.paymentDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-foreground-500">Recorded by</p>
                              <p className="text-sm">{payment.recordedByName}</p>
                            </div>
                          </div>
                          {payment.transactionId && (
                            <p className="text-xs text-foreground-400 mt-2">
                              Transaction ID: {payment.transactionId}
                            </p>
                          )}
                          {payment.notes && (
                            <p className="text-xs text-foreground-500 mt-1">
                              {payment.notes}
                            </p>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-content2">
                  <CardBody className="p-4 text-center">
                    <p className="text-foreground-500">No payments recorded yet</p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Payment History Modal */}
      <BottomSheet
        isOpen={isHistoryOpen}
        onClose={onHistoryClose}
        title="Payment History"
        subtitle={selectedUser ? `All recorded payments for ${selectedUser.userName}` : "Payment History"}
      >
        <div className="space-y-4">
          {allPaymentLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-content2 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <IconHistory size={32} className="text-foreground-400" />
              </div>
              <h4 className="text-lg font-medium mb-2">No Payment Records</h4>
              <p className="text-foreground-500">No payments have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allPaymentLogs.map((log) => (
                <Card key={log.id} shadow="none" className="border border-divider">
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-lg font-bold text-success">{formatCurrency(log.amount)}</p>
                        <p className="text-sm text-foreground-500">
                          {formatDate(log.paymentDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Chip size="sm" variant="flat" color="secondary">
                            {log.paymentMethod}
                          </Chip>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => openEditPayment(log)}
                          >
                            <IconEdit size={16} />
                          </Button>
                        </div>
                        <p className="text-xs text-foreground-400">
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

      {/* Update Password Modal */}
      <BottomSheet
        isOpen={isPasswordOpen}
        onClose={() => {
          onPasswordClose();
          resetPasswordForm();
        }}
        title="Update Password"
        subtitle="Change your super admin password"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="ghost"
              onPress={() => {
                onPasswordClose();
                resetPasswordForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpdatePassword}
              isLoading={updatingPassword}
              className="flex-1"
            >
              Update Password
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-content2 rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconUser size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Super Admin Account</h3>
              <p className="text-sm text-foreground-500">Update your admin password for enhanced security</p>
            </div>
          </div>

          <Input
            type="password"
            label="Current Password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            isRequired
            description="Your existing password"
          />

          <Input
            type="password"
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            isRequired
            description="Must be at least 8 characters long"
          />

          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isRequired
            description="Re-enter your new password"
          />

          <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-start gap-2">
              <IconAlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-warning">Security Notice</p>
                <p className="text-foreground-600 mt-1">
                  Make sure to use a strong password. You will need to re-authenticate after updating your password.
                </p>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Edit Payment Modal */}
      <BottomSheet
        isOpen={isEditPaymentOpen}
        onClose={() => {
          onEditPaymentClose();
          resetEditPaymentForm();
        }}
        title="Edit Payment"
        subtitle={editingPayment ? `Editing payment of ${formatCurrency(editingPayment.amount)}` : "Edit payment details"}
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="ghost"
              onPress={() => {
                onEditPaymentClose();
                resetEditPaymentForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpdatePayment}
              isLoading={updatingPayment}
              className="flex-1"
            >
              Update Payment
            </Button>
          </div>
        }
      >
        {editingPayment && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-content2 rounded-lg">
              <div className="p-2 bg-warning/10 rounded-lg">
                <IconEdit size={20} className="text-warning" />
              </div>
              <div>
                <h3 className="font-medium">Edit Payment Record</h3>
                <p className="text-sm text-foreground-500">
                  Originally recorded on {formatDate(editingPayment.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Payment Amount (₹)"
                placeholder="20000"
                value={editPaymentAmount}
                onChange={(e) => setEditPaymentAmount(e.target.value)}
                isRequired
              />
              <Select
                label="Payment Method"
                placeholder="Select method"
                selectedKeys={editPaymentMethod ? [editPaymentMethod] : []}
                onSelectionChange={(keys) => setEditPaymentMethod(Array.from(keys)[0] as string)}
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
              value={editPaymentDate}
              onChange={(date) => setEditPaymentDate(date || new Date())}
            />

            <Input
              label="Transaction ID"
              placeholder="Optional transaction reference"
              value={editTransactionId}
              onChange={(e) => setEditTransactionId(e.target.value)}
              description="For online payments or reference numbers"
            />

            <Input
              label="Notes"
              placeholder="Additional notes about this payment..."
              value={editPaymentNote}
              onChange={(e) => setEditPaymentNote(e.target.value)}
              description="Optional notes"
            />

            <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-start gap-2">
                <IconAlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Important Notice</p>
                  <p className="text-foreground-600 mt-1">
                    Editing this payment will recalculate the user's total amount paid and remaining balance. Make sure the changes are accurate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}