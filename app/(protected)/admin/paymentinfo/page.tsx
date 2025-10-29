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
} from "@tabler/icons-react";
import Link from "next/link";
import BottomSheet from "@/components/UI/BottomSheet";
import SuperAdminAuthModal from "@/components/SuperAdminAuthModal";

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

  // Super Admin Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);
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
    onOpen();
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    onAuthClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Dashboard</h1>
        <p className="text-foreground-500 mt-2">
          Monitor and manage all user payments and billing information.
        </p>
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
              classNames={{
                table: "min-h-[400px]",
                wrapper: "min-h-[400px]",
              }}
            >
            <TableHeader>
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
              {users.map((user) => (
                <TableRow key={user.id}>
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
                      <Tooltip content="Manage Payment">
                        <Button
                          as={Link}
                          href={`/admin/users/${user.id}/progress`}
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                        >
                          <IconCreditCard size={18} />
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
          <div className="flex gap-3 justify-end">
            <Button color="primary" variant="light" onPress={onClose}>
              Close
            </Button>
            {selectedUser && (
              <Button
                as={Link}
                href={`/admin/users/${selectedUser.id}/progress`}
                color="primary"
              >
                Manage Payment
              </Button>
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
            <Card className="bg-content2">
              <CardBody className="p-4">
                <h4 className="font-semibold mb-3">Payment Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-foreground-500">Package Price</p>
                    <p className="font-medium">
                      {selectedUser.packagePrice ? formatCurrency(selectedUser.packagePrice) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500">Final Price</p>
                    <p className="font-medium">
                      {selectedUser.discountedPrice ? formatCurrency(selectedUser.discountedPrice) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500">Amount Paid</p>
                    <p className="font-medium text-success">
                      {formatCurrency(selectedUser.totalAmountPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500">Remaining</p>
                    <p className={`font-medium ${selectedUser.remainingAmount > 0 ? 'text-warning' : 'text-success'}`}>
                      {formatCurrency(selectedUser.remainingAmount)}
                    </p>
                  </div>
                </div>
                {selectedUser.paymentNotes && (
                  <div className="mt-3">
                    <p className="text-xs text-foreground-500">Notes</p>
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
    </div>
  );
}