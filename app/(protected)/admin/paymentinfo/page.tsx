"use client";

import { useState, useEffect } from "react";
import { nowIST, formatIST, formatISTDateTime, toISTDateString } from "@/utils/timezone";
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
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
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
  IconCalculator,
  IconTrash,
  IconCalendar,
  IconPrinter,
  IconDownload,
  IconFilter,
  IconDotsVertical,
  IconReportAnalytics,
  IconChartPie,
  IconReceiptTax,
  IconChevronLeft,
  IconChevronRight,
  IconChartBar,
  IconCalendarEvent,
  IconX,
  IconChartAreaFilled
} from "@tabler/icons-react";
import Link from "next/link";
import BottomSheet from "@/components/UI/BottomSheet";
import SuperAdminAuthModal from "@/components/SuperAdminAuthModal";
import DatePicker from "@/components/UI/DatePicker";
import AdminPagination from "@/components/Admin/AdminPagination";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
} from "recharts";

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
  // Additional fields from API
  userName?: string;
  userEmail?: string;
  userImageUrl?: string;
}

interface MembershipAnalytics {
  startDate: string;
  endDate: string;
  totalDays: number;
  monthsTotal: number;
  daysRemaining: number;
  remainingMonths: number;
  daysElapsed: number;
  isExpired: boolean;
  isPaused: boolean;
  isUpcoming: boolean;
  perDayRate: number;
  setupDiscount: number;
  discountPercentage: number;
  paymentPercentage: number;
  daysCoveredByPayments: number;
  pausedDays: number;
  membershipStatus: string;
  membershipNotes: string | null;
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
  membershipAnalytics: MembershipAnalytics | null;
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

// Monthly Expenses Interfaces
interface MonthlyExpenseUser {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImageUrl: string;
  packagePrice: number | null;
  discountedPrice: number | null;
  totalAmountPaid: number | null;
  remainingAmount: number | null;
  membershipStatus: string;
  paymentBreakdown: {
    allocatedAmount: number;
    paidAmount: number;
    availableForSpending: number;
    daysInMonth: number;
    payments: any[];
  } | null;
  monthlyPayments: PaymentLog[];
}

interface MonthlyData {
  month: string;
  year: number;
  totalIncome: number;
  totalClients: number;
  averagePayment: number;
  payments: PaymentLog[];
  users: MonthlyExpenseUser[];
  totalAvailableForSpending: number;
  budgetAllocation: any;
}

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
  recordedBy?: string;
  recordedByName?: string;
}

interface MonthlyExpenses {
  month: string;
  year: number;
  customExpenses: ExpenseItem[];
  totalExpenses: number;
}

const paymentMethods = [
  { key: "CASH", label: "Cash" },
  { key: "ONLINE", label: "Online" },
  { key: "CARD", label: "Card" },
  { key: "UPI", label: "UPI" },
  { key: "BANK_TRANSFER", label: "Bank Transfer" },
  { key: "CHEQUE", label: "Cheque" },
];

const expenseCategories = [
  "Rent & Utilities",
  "Staff Salaries",
  "Equipment Purchase",
  "Equipment Maintenance",
  "Marketing & Advertising",
  "Insurance",
  "Professional Services",
  "Office Supplies",
  "Internet & Phone",
  "Cleaning & Maintenance",
  "Security Services",
  "Transportation",
  "Food & Beverages",
  "Training & Certification",
  "Legal & Compliance",
  "Bank Charges",
  "Miscellaneous",
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
  const [activeTab, setActiveTab] = useState("user-payments");
  const [addingPayment, setAddingPayment] = useState(false);

  // Monthly Expenses State
  const [monthlyCurrentDate, setMonthlyCurrentDate] = useState(nowIST());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyData | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<MonthlyExpenses | null>(null);
  const [monthlyViewMode, setMonthlyViewMode] = useState<'overview' | 'detailed'>('overview');
  const [monthlyCurrentTab, setMonthlyCurrentTab] = useState('users');
  const [monthlyCurrentPage, setMonthlyCurrentPage] = useState(1);
  const [monthlySearchTerm, setMonthlySearchTerm] = useState("");
  const [monthlyMethodFilter, setMonthlyMethodFilter] = useState("all");
  const monthlyItemsPerPage = 10;

  // Detailed view filtering and sorting states
  const [detailedPerformanceFilter, setDetailedPerformanceFilter] = useState("all");
  const [detailedSortBy, setDetailedSortBy] = useState("month");

  // Monthly expenses users pagination states
  const [monthlyUsersPage, setMonthlyUsersPage] = useState(1);
  const [monthlyUsersSearchTerm, setMonthlyUsersSearchTerm] = useState("");
  const [monthlyUsersMembershipFilter, setMonthlyUsersMembershipFilter] = useState("all");
  const monthlyUsersItemsPerPage = 10;

  // Expense filtering states
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expenseSearchTerm, setExpenseSearchTerm] = useState("");
  const [expensePage, setExpensePage] = useState(1);
  const expenseItemsPerPage = 10;

  // Pricing form state
  const [membershipMonths, setMembershipMonths] = useState("");
  const [pricePerMonth, setPricePerMonth] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [initialOfferedPrice, setInitialOfferedPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Next payment due state (for main modal)
  const [nextPaymentDue, setNextPaymentDue] = useState<Date | undefined>(undefined);
  const [updatingDueDate, setUpdatingDueDate] = useState(false);

  // Add payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(nowIST());
  const [transactionId, setTransactionId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Modals
  const { isOpen: isPricingOpen, onOpen: onPricingOpen, onClose: onPricingClose } = useDisclosure();

  // Custom close handler for pricing modal
  const handlePricingClose = () => {
    onPricingClose();
    // Clear form when closing
    setMembershipMonths("");
    setPricePerMonth("");
    setPackagePrice("");
    setDiscountedPrice("");
    setPaymentNotes("");
  };
  const { isOpen: isAddPaymentOpen, onOpen: onAddPaymentOpen, onClose: onAddPaymentClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  const { isOpen: isEditPaymentOpen, onOpen: onEditPaymentOpen, onClose: onEditPaymentClose } = useDisclosure();
  const { isOpen: isBreakdownOpen, onOpen: onBreakdownOpen, onClose: onBreakdownClose } = useDisclosure();

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Edit payment state
  const [editingPayment, setEditingPayment] = useState<PaymentLog | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState<Date>(nowIST());
  const [editTransactionId, setEditTransactionId] = useState("");
  const [editPaymentNote, setEditPaymentNote] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Super Admin Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);

  // Force refresh key for modal components
  const [modalRefreshKey, setModalRefreshKey] = useState(0);

  // Payment breakdown state
  const [paymentBreakdown, setPaymentBreakdown] = useState<any>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  // Confirmation modal states
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const { isOpen: isClearUserConfirmOpen, onOpen: onClearUserConfirmOpen, onClose: onClearUserConfirmClose } = useDisclosure();
  const { isOpen: isClearAllConfirmOpen, onOpen: onClearAllConfirmOpen, onClose: onClearAllConfirmClose } = useDisclosure();
  const { isOpen: isWarningOpen, onOpen: onWarningOpen, onClose: onWarningClose } = useDisclosure();
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmData, setConfirmData] = useState<any>(null);
  const [warningData, setWarningData] = useState<any>(null);

  // Monthly Expenses Modals
  const { isOpen: isMonthlyDetailOpen, onOpen: onMonthlyDetailOpen, onClose: onMonthlyDetailClose } = useDisclosure();
  const { isOpen: isAddExpenseOpen, onOpen: onAddExpenseOpen, onClose: onAddExpenseClose } = useDisclosure();

  // Monthly Expenses Form State
  const [expenseForm, setExpenseForm] = useState({
    category: "",
    description: "",
    amount: "",
    date: toISTDateString(nowIST()),
    notes: "",
  });
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);

  const forceModalRefresh = () => {
    setModalRefreshKey(prev => prev + 1);
  };
  const { isOpen: isAuthOpen, onOpen: onAuthOpen, onClose: onAuthClose } = useDisclosure();

  const limit = 20;

  // Monthly Expenses Functions
  const fetchMonthlyData = async () => {
    setMonthlyLoading(true);
    try {
      const year = monthlyCurrentDate.getFullYear();
      const response = await fetch(`/api/admin/monthly-expenses?year=${year}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data.monthlyData || []);
        setMonthlyExpenses(data.monthlyExpenses || []);
      } else {
        console.error('Failed to fetch monthly data');
        toast.error('Failed to fetch monthly data');
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      toast.error('Error fetching monthly data');
    } finally {
      setMonthlyLoading(false);
    }
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(monthlyCurrentDate);
    newDate.setFullYear(monthlyCurrentDate.getFullYear() + (direction === 'next' ? 1 : -1));
    setMonthlyCurrentDate(newDate);
  };

  const openMonthDetails = (monthData: MonthlyData) => {
    setSelectedMonth(monthData);
    setMonthlyCurrentPage(1);
    setMonthlySearchTerm("");
    setMonthlyMethodFilter("all");

    // Reset users pagination states
    setMonthlyUsersPage(1);
    setMonthlyUsersSearchTerm("");
    setMonthlyUsersMembershipFilter("all");

    // Find corresponding expenses
    const expenses = monthlyExpenses.find(e =>
      e.month === monthData.month && e.year === monthData.year
    );
    setSelectedExpenses(expenses || {
      month: monthData.month,
      year: monthData.year,
      customExpenses: [],
      totalExpenses: 0
    });
    onMonthlyDetailOpen();
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: "",
      description: "",
      amount: "",
      date: toISTDateString(nowIST()),
      notes: "",
    });
    onAddExpenseOpen();
  };

  const openEditExpenseModal = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      notes: expense.notes || "",
    });
    onAddExpenseOpen();
  };

  const saveExpense = async () => {
    if (!selectedMonth || !expenseForm.category || !expenseForm.description || !expenseForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSavingExpense(true);

      const expenseData = {
        id: editingExpense?.id || undefined,
        month: selectedMonth.month,
        year: selectedMonth.year,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        date: expenseForm.date,
        notes: expenseForm.notes,
        action: editingExpense ? 'update' : 'create',
      };

      const response = await fetch('/api/admin/monthly-expenses/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(editingExpense ? 'Expense updated successfully' : 'Expense added successfully');
        onAddExpenseClose();

        // Update the UI immediately with the returned data
        if (result.expenseData && selectedMonth) {
          setSelectedExpenses(result.expenseData);

          // Update the monthly expenses array
          setMonthlyExpenses(prev => {
            const updated = prev.filter(e => !(e.month === result.expenseData.month && e.year === result.expenseData.year));
            return [...updated, result.expenseData];
          });
        }

        // Also refresh the full data to ensure everything is in sync
        fetchMonthlyData();
      } else {
        toast.error('Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Error saving expense');
    } finally {
      setSavingExpense(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!selectedMonth) return;

    try {
      const response = await fetch('/api/admin/monthly-expenses/expense', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expenseId,
          month: selectedMonth.month,
          year: selectedMonth.year,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Expense deleted successfully');

        // Update the UI immediately
        if (result.expenseData && selectedMonth) {
          setSelectedExpenses(result.expenseData);

          // Update the monthly expenses array
          setMonthlyExpenses(prev => {
            const updated = prev.filter(e => !(e.month === result.expenseData.month && e.year === result.expenseData.year));
            return [...updated, result.expenseData];
          });
        }

        // Also refresh the full data
        fetchMonthlyData();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error deleting expense');
    }
  };

  const getMonthName = (monthIndex: number) => {
    return formatIST(new Date(2024, monthIndex, 1), false, { month: 'long' });
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentData();
    }
  }, [page, searchTerm, statusFilter, isAuthenticated]);

  // Fetch monthly data when tab changes to monthly expenses
  useEffect(() => {
    if (isAuthenticated && activeTab === "monthly-expenses") {
      fetchMonthlyData();
    }
  }, [monthlyCurrentDate, isAuthenticated, activeTab]);

  // Listen for membership updates from other pages
  useEffect(() => {
    const handleMembershipUpdate = () => {
      // Refresh payment data when membership is updated
      if (isAuthenticated) {
        fetchPaymentData();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'membershipUpdated') {
        handleMembershipUpdate();
      }
    };

    window.addEventListener('membershipUpdated', handleMembershipUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('membershipUpdated', handleMembershipUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated]);

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
        _t: Date.now().toString(), // Cache busting
      });

      const response = await fetch(`/api/admin/paymentinfo?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
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

  // Calculate pricing based on discounted price and months
  const calculatePricing = (finalPrice: number, months: number) => {
    const perMonthRate = finalPrice / months;
    setPricePerMonth(perMonthRate.toString());
  };

  // Handle months change
  const handleMonthsChange = (value: string) => {
    setMembershipMonths(value);

    // Calculate price per month if final pricing is available
    const months = parseInt(value);
    const finalPriceValue = parseFloat(discountedPrice);

    if (months > 0 && finalPriceValue > 0) {
      calculatePricing(finalPriceValue, months);
    }
  };

  // Handle package price change
  const handlePackagePriceChange = (value: string) => {
    setPackagePrice(value);

    // Calculate price per month if all values are available
    const finalPriceValue = parseFloat(discountedPrice);
    const months = parseInt(membershipMonths);

    if (months > 0 && finalPriceValue > 0) {
      calculatePricing(finalPriceValue, months);
    }
  };

  // Handle final price change
  const handleFinalPriceChange = (value: string) => {
    setDiscountedPrice(value);
    const finalPriceValue = parseFloat(value);
    const months = parseInt(membershipMonths);

    if (months > 0 && finalPriceValue > 0) {
      calculatePricing(finalPriceValue, months);
    }
  };

  const openUserDetails = (user: PaymentUser) => {
    setSelectedUser(user);
    // Populate form with existing data
    setPackagePrice(user.packagePrice?.toString() || "");
    setDiscountedPrice(user.discountedPrice?.toString() || "");
    setPaymentNotes(user.paymentNotes || "");

    // Calculate months and per-month from existing data
    if (user.membershipAnalytics && user.packagePrice) {
      const months = user.membershipAnalytics.monthsTotal;
      const perMonth = user.packagePrice / months;
      setMembershipMonths(months.toString());
      setPricePerMonth(perMonth.toString());
    } else {
      setMembershipMonths("");
      setPricePerMonth("");
    }

    // Set next payment due date
    if (user.nextPaymentDue) {
      setNextPaymentDue(new Date(user.nextPaymentDue));
    } else {
      setNextPaymentDue(undefined);
    }
    fetchUserPaymentHistory(user.id);
    onOpen();
  };

  const openPaymentBreakdown = async (user: PaymentUser) => {
    await handleOpenPaymentBreakdown(user);
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
        initialOfferedPrice: null, // Not using this field anymore
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

        // Update the selected user with the new data FIRST
        if (selectedUser && updatedData.paymentInfo) {
          const paymentInfo = updatedData.paymentInfo;

          // Calculate payment status using utility function
          const paymentStatus = calculatePaymentStatus(
            paymentInfo.discountedPrice,
            paymentInfo.totalAmountPaid,
            paymentInfo.remainingAmount,
            paymentInfo.nextPaymentDue
          );

          // Update selected user with new payment status and re-calculate analytics
          const updatedUser = {
            ...selectedUser,
            packagePrice: paymentInfo.packagePrice,
            initialOfferedPrice: (paymentInfo as any).initialOfferedPrice,
            discountedPrice: paymentInfo.discountedPrice,
            totalAmountPaid: paymentInfo.totalAmountPaid,
            remainingAmount: paymentInfo.remainingAmount,
            nextPaymentDue: paymentInfo.nextPaymentDue,
            paymentNotes: paymentInfo.paymentNotes,
            paymentStatus: paymentStatus as any,
            // Re-calculate analytics if membership exists
            membershipAnalytics: selectedUser.membershipAnalytics ? {
              ...selectedUser.membershipAnalytics,
              // Calculate based on current membership pricing, not total accumulated pricing
              perDayRate: (() => {
                const currentMembershipPrice = paymentInfo.discountedPrice || paymentInfo.packagePrice || 0;
                return currentMembershipPrice && selectedUser.membershipAnalytics.totalDays ?
                  currentMembershipPrice / selectedUser.membershipAnalytics.totalDays : 0;
              })(),
              setupDiscount: paymentInfo.packagePrice && paymentInfo.discountedPrice ?
                paymentInfo.packagePrice - paymentInfo.discountedPrice : 0,
              discountPercentage: paymentInfo.packagePrice && paymentInfo.discountedPrice ?
                ((paymentInfo.packagePrice - paymentInfo.discountedPrice) / paymentInfo.packagePrice) * 100 : 0,
              paymentPercentage: (() => {
                const currentMembershipPrice = paymentInfo.discountedPrice || paymentInfo.packagePrice || 0;
                return currentMembershipPrice && paymentInfo.totalAmountPaid ?
                  Math.min(100, (paymentInfo.totalAmountPaid / currentMembershipPrice) * 100) : 0;
              })(),
              daysCoveredByPayments: (() => {
                const currentMembershipPrice = paymentInfo.discountedPrice || paymentInfo.packagePrice || 0;
                const perDayRate = currentMembershipPrice && selectedUser.membershipAnalytics.totalDays ?
                  currentMembershipPrice / selectedUser.membershipAnalytics.totalDays : 0;
                return perDayRate && paymentInfo.totalAmountPaid ?
                  Math.floor(paymentInfo.totalAmountPaid / perDayRate) : 0;
              })()
            } : null
          };

          setSelectedUser(updatedUser);
          forceModalRefresh(); // Force modal re-render

          // Update the form fields to reflect the saved data
          setPackagePrice(paymentInfo.packagePrice?.toString() || "");
          setInitialOfferedPrice((paymentInfo as any).initialOfferedPrice?.toString() || "");
          setDiscountedPrice(paymentInfo.discountedPrice?.toString() || "");
          setPaymentNotes(paymentInfo.paymentNotes || "");

          // Calculate and update months/per-month if possible
          if (updatedUser.membershipAnalytics && paymentInfo.packagePrice) {
            const months = updatedUser.membershipAnalytics.monthsTotal;
            const perMonth = paymentInfo.packagePrice / months;
            setMembershipMonths(months.toString());
            setPricePerMonth(perMonth.toString());
          }
        }

        // Refresh the main data and wait for it to complete
        await fetchPaymentData();

        // Force refresh the selected user with updated data from the server
        const refreshedUsers = await fetch('/api/admin/paymentinfo?limit=100').then(res => res.json());
        const updatedUserFromServer = refreshedUsers.users?.find((u: any) => u.id === selectedUser.id);
        if (updatedUserFromServer) {
          setSelectedUser(updatedUserFromServer);
          forceModalRefresh();
        }

        // Close the modal after successful update
        handlePricingClose();
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
        paymentDate: toISTDateString(paymentDate),
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
    setPaymentDate(nowIST());
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
          nextPaymentDue: newDate ? toISTDateString(newDate) : null,
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
          newDate ? toISTDateString(newDate) : null
        );

        // Update selected user with new due date and recalculated status
        const updatedUser = {
          ...selectedUser,
          nextPaymentDue: newDate ? toISTDateString(newDate) : null,
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
        paymentDate: toISTDateString(editPaymentDate),
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

  // Delete payment function with confirmation
  const handleDeletePayment = (paymentId: string, amount: number) => {
    setConfirmData({ paymentId, amount, type: 'payment' });
    setConfirmAction(() => () => performDeletePayment(paymentId, amount));
    onDeleteConfirmOpen();
  };

  const performDeletePayment = async (paymentId: string, amount: number) => {
    try {
      const response = await fetch(`/api/admin/users/${selectedUser?.id}/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Payment deleted successfully!");

        // Update the UI immediately
        if (selectedUser) {
          // Update payment history logs
          const updatedLogs = allPaymentLogs.filter(log => log.id !== paymentId);
          setAllPaymentLogs(updatedLogs);

          // Calculate new totals
          const newTotalPaid = selectedUser.totalAmountPaid - amount;
          const newRemainingAmount = (selectedUser.discountedPrice || 0) - newTotalPaid;

          // Update the selected user
          const updatedUser = {
            ...selectedUser,
            totalAmountPaid: newTotalPaid,
            remainingAmount: newRemainingAmount,
            recentPayments: selectedUser.recentPayments.filter(p => p.id !== paymentId)
          };

          setSelectedUser(updatedUser);

          // Update the users list
          setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));

          // Refresh main data to sync everything
          fetchPaymentData();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete payment");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  };

  // Delete all payment records for a specific user
  const handleDeleteAllUserPayments = (user: PaymentUser) => {
    setConfirmData({ user, type: 'clearUser' });
    setConfirmAction(() => () => performDeleteAllUserPayments(user));
    onClearUserConfirmOpen();
  };

  const performDeleteAllUserPayments = async (user: PaymentUser) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/clear-payments`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("All payment records deleted successfully!");

        // Update the user object with reset values (clearing all payment data)
        const updatedUser = {
          ...user,
          packagePrice: null,
          discountedPrice: null,
          totalAmountPaid: 0,
          remainingAmount: 0,
          paymentNotes: null,
          membershipAnalytics: null, // Clear analytics too
          recentPayments: []
        };

        // Update the selected user if it's the same user
        if (selectedUser?.id === user.id) {
          setSelectedUser(updatedUser);
        }

        // Update the users list
        setUsers(users.map(u => u.id === user.id ? updatedUser : u));

        // Refresh all data
        fetchPaymentData();
        fetchUserPaymentHistory(user.id);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete payment records");
      }
    } catch (error) {
      console.error("Error deleting payment records:", error);
      toast.error("Failed to delete payment records");
    }
  };

  // Clear all payment and pricing records
  const handleClearAllRecords = () => {
    setConfirmData({ type: 'clearAll' });
    setConfirmAction(() => () => performClearAllRecords());
    onClearAllConfirmOpen();
  };

  const performClearAllRecords = async () => {
    try {
      const response = await fetch('/api/admin/paymentinfo/clear-all', {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        toast.success("All payment records cleared successfully!");
        // Force refresh all data with cache busting
        setLoading(true);
        await fetchPaymentData();
        if (selectedUser) {
          await fetchUserPaymentHistory(selectedUser.id);
        }
        // Force a page reload to ensure all components refresh
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to clear all records");
      }
    } catch (error) {
      console.error("Error clearing all records:", error);
      toast.error("Failed to clear all records");
    }
  };

  const resetEditPaymentForm = () => {
    setEditingPayment(null);
    setEditPaymentAmount("");
    setEditPaymentMethod("");
    setEditPaymentDate(nowIST());
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
        const today = nowIST();
        paymentStatus = dueDate < today ? 'overdue' : 'pending';
      } else {
        paymentStatus = 'pending';
      }
    }
    return paymentStatus;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return formatIST(new Date(dateString), true, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to calculate correct analytics for current membership pricing
  const getCorrectAnalytics = (user: PaymentUser) => {
    if (!user.membershipAnalytics) return null;

    const currentMembershipPrice = user.discountedPrice || user.packagePrice || 0;
    const totalDays = user.membershipAnalytics.totalDays;
    const perDayRate = currentMembershipPrice / totalDays;
    const paymentPercentage = currentMembershipPrice > 0 ? Math.min(100, (user.totalAmountPaid / currentMembershipPrice) * 100) : 0;
    const daysCoveredByPayments = perDayRate > 0 ? Math.floor(user.totalAmountPaid / perDayRate) : 0;

    return {
      ...user.membershipAnalytics,
      perDayRate: Math.round(perDayRate * 100) / 100,
      paymentPercentage: Math.round(paymentPercentage * 100) / 100,
      daysCoveredByPayments,
      // Calculate correct remaining amount and days
      correctRemainingAmount: Math.max(0, currentMembershipPrice - user.totalAmountPaid),
      correctDaysRemaining: Math.max(0, totalDays - daysCoveredByPayments)
    };
  };

  // Payment breakdown calculation function based on gym membership periods
  const calculatePaymentBreakdown = async (user: PaymentUser) => {
    // Fetch membership history for this user
    let membershipHistory = null;
    let currentMembership = null;
    try {
      const historyResponse = await fetch(`/api/admin/users/${user.id}/membership-history`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        membershipHistory = historyData.membershipLogs;
        currentMembership = historyData.membershipInfo;
      }
    } catch (error) {
      console.error('Error fetching membership history:', error);
    }

    // If no current membership info, return error
    if (!currentMembership || !currentMembership.membershipStartDate || !currentMembership.membershipDuration) {
      return {
        type: 'noMembership',
        userName: user.userName,
        message: 'Gym membership not set up for this user. Please set up membership details first.'
      };
    }

    // Fetch ALL payment logs (not just recent 3)
    let allPayments = [];
    try {
      const paymentsResponse = await fetch(`/api/admin/users/${user.id}/payments`);
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        allPayments = paymentsData.paymentLogs || [];
      }
    } catch (error) {
      console.error('Error fetching payment logs:', error);
    }

    // Build membership periods from history
    const membershipPeriods: Array<{
      startDate: Date;
      endDate: Date;
      duration: number;
      status: string;
      changeType: string;
      notes: string | null;
      packagePrice: number;
    }> = [];

    // First pass: collect all periods without pricing
    const tempPeriods: Array<{
      startDate: Date;
      endDate: Date;
      duration: number;
      status: string;
      changeType: string;
      notes: string | null;
    }> = [];

    if (membershipHistory && membershipHistory.length > 0) {
      // Sort logs by change date ascending
      const sortedLogs = [...membershipHistory].sort((a: any, b: any) =>
        new Date(a.changeDate).getTime() - new Date(b.changeDate).getTime()
      );

      // Track membership periods - consolidate extensions and date changes into continuous memberships
      for (let i = 0; i < sortedLogs.length; i++) {
        const log = sortedLogs[i];

        // Skip status-only changes, extensions, and date changes that don't create new periods
        if (log.changeType === 'STATUS_CHANGE' || log.changeType === 'PAUSE' || log.changeType === 'RESUME' ||
            log.changeType === 'EXTENSION' || log.changeType === 'DATE_CHANGE') {
          continue;
        }

        // For INITIAL_SETUP, use the newStartDate and newEndDate
        if (log.changeType === 'INITIAL_SETUP' && log.newStartDate && log.newEndDate && log.newDuration) {
          const startDate = new Date(log.newStartDate);
          const endDate = new Date(log.newEndDate);
          const duration = log.newDuration;

          const now = nowIST();
          let actualStatus = 'ACTIVE';
          if (now < startDate) {
            actualStatus = 'UPCOMING';
          } else if (now > endDate) {
            actualStatus = 'EXPIRED';
          } else if (log.newStatus === 'PAUSED') {
            actualStatus = 'PAUSED';
          }

          tempPeriods.push({
            startDate,
            endDate,
            duration,
            status: actualStatus,
            changeType: log.changeType,
            notes: log.notes
          });
        }
        // For EXTENSION, create a new period from previousEndDate to newEndDate
        else if (log.changeType === 'EXTENSION' && log.previousEndDate && log.newEndDate && log.newDuration) {
          const prevEnd = new Date(log.previousEndDate);
          const newEnd = new Date(log.newEndDate);

          // Skip extensions that don't actually extend (duplicate/invalid logs)
          if (prevEnd.getTime() === newEnd.getTime()) {
            continue;
          }

          // Try to extract actual start date from notes
          // Notes format: "Extension of X months starting Mon Nov 03 2025"
          let actualStartDate: Date | null = null;
          if (log.notes) {
            const dateMatch = log.notes.match(/starting\s+\w+\s+(\w+)\s+(\d+)\s+(\d{4})/);
            if (dateMatch) {
              const [, month, day, year] = dateMatch;
              const dateStr = `${month} ${day}, ${year}`;
              actualStartDate = new Date(dateStr);
            }
          }

          // Use the extracted date if valid, otherwise fall back to previousEndDate
          const startDate = actualStartDate && !isNaN(actualStartDate.getTime())
            ? actualStartDate
            : prevEnd;
          const endDate = newEnd;
          const duration = log.newDuration;

          const now = nowIST();
          let actualStatus = 'ACTIVE';
          if (now < startDate) {
            actualStatus = 'UPCOMING';
          } else if (now > endDate) {
            actualStatus = 'EXPIRED';
          } else if (log.newStatus === 'PAUSED') {
            actualStatus = 'PAUSED';
          }

          tempPeriods.push({
            startDate,
            endDate,
            duration,
            status: actualStatus,
            changeType: log.changeType,
            notes: log.notes
          });
        }
        // For RENEWAL or other types with full date info
        else if (log.newStartDate && log.newEndDate && log.newDuration) {
          const startDate = new Date(log.newStartDate);
          const endDate = new Date(log.newEndDate);
          const duration = log.newDuration;

          const now = nowIST();
          let actualStatus = 'ACTIVE';
          if (now < startDate) {
            actualStatus = 'UPCOMING';
          } else if (now > endDate) {
            actualStatus = 'EXPIRED';
          } else if (log.newStatus === 'PAUSED') {
            actualStatus = 'PAUSED';
          }

          tempPeriods.push({
            startDate,
            endDate,
            duration,
            status: actualStatus,
            changeType: log.changeType,
            notes: log.notes
          });
        }
      }
    }

    // Always add current membership period if it exists
    if (currentMembership.membershipStartDate && currentMembership.membershipEndDate) {
      const startDate = new Date(currentMembership.membershipStartDate);
      const endDate = new Date(currentMembership.membershipEndDate);

      // Check if this current period is different from any historical periods
      const isDifferentPeriod = !tempPeriods.some(p =>
        p.startDate.getTime() === startDate.getTime() &&
        p.endDate.getTime() === endDate.getTime()
      );

      if (isDifferentPeriod) {
        const now = nowIST();
        let actualStatus = currentMembership.membershipStatus;

        // Override status based on dates
        if (now < startDate) {
          actualStatus = 'UPCOMING';
        } else if (now > endDate) {
          actualStatus = 'EXPIRED';
        } else if (currentMembership.membershipStatus === 'PAUSED') {
          actualStatus = 'PAUSED';
        } else if (currentMembership.membershipStatus === 'ACTIVE') {
          actualStatus = 'ACTIVE';
        }

        tempPeriods.push({
          startDate,
          endDate,
          duration: currentMembership.membershipDuration,
          status: actualStatus,
          changeType: 'CURRENT',
          notes: currentMembership.membershipNotes
        });
      }
    }

    // Get total package price from discounted price
    const totalPackagePrice = user.discountedPrice || 0;

    // Second pass: assign pricing to each period
    for (const period of tempPeriods) {
      // Each period represents a separate billing/purchase cycle
      // Current membership and distinct historical periods each get full package price
      let periodPackagePrice = totalPackagePrice;

      membershipPeriods.push({
        ...period,
        packagePrice: Math.round(periodPackagePrice * 100) / 100
      });
    }

    // Sort periods by start date descending (latest first)
    membershipPeriods.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    // Calculate payment breakdown for each membership period
    const membershipBreakdown = membershipPeriods.map((period, index) => {
      const periodStart = period.startDate;
      const periodEnd = period.endDate;
      const periodDuration = period.duration;

      // Use the package price calculated for this specific period
      const periodPackagePrice = period.packagePrice;

      // Find payments made during this period
      const periodPayments = allPayments.filter((payment: any) => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= periodStart && paymentDate <= periodEnd;
      });

      const periodPaidAmount = periodPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const periodRemainingAmount = Math.max(0, periodPackagePrice - periodPaidAmount);
      const perDayRate = periodDuration > 0 ? periodPackagePrice / periodDuration : 0;

      return {
        periodNumber: index + 1,
        startDate: formatIST(periodStart, false, { day: 'numeric', month: 'long', year: 'numeric' }),
        endDate: formatIST(periodEnd, false, { day: 'numeric', month: 'long', year: 'numeric' }),
        duration: periodDuration,
        status: period.status,
        changeType: period.changeType,
        notes: period.notes,
        packagePrice: Math.round(periodPackagePrice * 100) / 100,
        paidAmount: Math.round(periodPaidAmount * 100) / 100,
        remainingAmount: Math.round(periodRemainingAmount * 100) / 100,
        perDayRate: Math.round(perDayRate * 100) / 100,
        paymentProgress: periodPackagePrice > 0 ? Math.round((periodPaidAmount / periodPackagePrice) * 100) : 0,
        payments: periodPayments.map((p: any) => ({
          date: formatIST(new Date(p.paymentDate), true, { day: 'numeric', month: 'short', year: 'numeric' }),
          amount: p.amount,
          method: p.paymentMethod,
          transactionId: p.transactionId,
          notes: p.notes,
          recordedByName: p.recordedByName
        }))
      };
    });

    const totalPackageAmount = user.discountedPrice || 0;
    const totalPaidAmount = user.totalAmountPaid || 0;

    return {
      type: 'success',
      userName: user.userName,
      totalPackageAmount,
      totalPaidAmount,
      remainingAmount: user.remainingAmount || 0,
      membershipInfo: {
        startDate: formatIST(new Date(currentMembership.membershipStartDate), false, { day: 'numeric', month: 'long', year: 'numeric' }),
        endDate: currentMembership.membershipEndDate ?
          formatIST(new Date(currentMembership.membershipEndDate), false, { day: 'numeric', month: 'long', year: 'numeric' }) :
          'Not set',
        duration: currentMembership.membershipDuration,
        status: currentMembership.membershipStatus,
        perDayRate: totalPackageAmount > 0 && currentMembership.membershipDuration > 0 ?
          Math.round((totalPackageAmount / currentMembership.membershipDuration) * 100) / 100 : 0
      },
      membershipBreakdown,
      paymentStats: {
        totalPayments: allPayments.length,
        averagePayment: allPayments.length > 0 ? Math.round((totalPaidAmount / allPayments.length) * 100) / 100 : 0,
        completionPercentage: totalPackageAmount > 0 ? Math.round((totalPaidAmount / totalPackageAmount) * 100) : 0
      }
    };
  };

  // Fallback function for payment-based calculation when membership info is not available
  const calculatePaymentBasedBreakdown = (user: PaymentUser) => {
    // Sort payments by date (earliest first)
    const sortedPayments = [...user.recentPayments].sort((a, b) =>
      new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );

    const totalPackageAmount = user.discountedPrice;
    const totalPaidAmount = user.totalAmountPaid;

    // Group payments by month-year for breakdown
    const paymentsByMonth: { [key: string]: { payments: PaymentLog[], total: number, month: string, year: number } } = {};

    sortedPayments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;

      if (!paymentsByMonth[monthKey]) {
        paymentsByMonth[monthKey] = {
          payments: [],
          total: 0,
          month: formatIST(paymentDate, false, { month: 'long' }),
          year: paymentDate.getFullYear()
        };
      }

      paymentsByMonth[monthKey].payments.push(payment);
      paymentsByMonth[monthKey].total += payment.amount;
    });

    // Create month breakdown array
    const monthBreakdown = Object.keys(paymentsByMonth)
      .sort()
      .map(monthKey => {
        const monthData = paymentsByMonth[monthKey];
        const payments = monthData.payments;

        const dates = payments.map(p => new Date(p.paymentDate)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        return {
          month: `${monthData.month} ${monthData.year}`,
          startDate: formatIST(startDate, false, { day: 'numeric', month: 'short' }),
          endDate: formatIST(endDate, false, { day: 'numeric', month: 'short' }),
          paidAmount: monthData.total,
          payments: payments.map(p => ({
            date: formatIST(new Date(p.paymentDate), true, { day: 'numeric', month: 'short', year: 'numeric' }),
            amount: p.amount,
            method: p.paymentMethod,
            transactionId: p.transactionId
          }))
        };
      });

    const firstPaymentDate = new Date(sortedPayments[0].paymentDate);
    const lastPaymentDate = new Date(sortedPayments[sortedPayments.length - 1].paymentDate);
    const periodDays = Math.ceil((lastPaymentDate.getTime() - firstPaymentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      userName: user.userName,
      totalPackageAmount,
      totalPaidAmount,
      remainingAmount: user.remainingAmount,
      paymentPeriod: {
        startDate: formatIST(firstPaymentDate, false, { day: 'numeric', month: 'long', year: 'numeric' }),
        endDate: formatIST(lastPaymentDate, false, { day: 'numeric', month: 'long', year: 'numeric' }),
        days: periodDays
      },
      monthBreakdown,
      paymentStats: {
        totalPayments: sortedPayments.length,
        averagePayment: Math.round((totalPaidAmount / sortedPayments.length) * 100) / 100,
        completionPercentage: totalPackageAmount ? Math.round((totalPaidAmount / totalPackageAmount) * 100) : 0
      }
    };
  };

  // Function to handle opening payment breakdown modal
  const handleOpenPaymentBreakdown = async (user: PaymentUser) => {
    try {
      setLoadingBreakdown(true);
      const breakdown = await calculatePaymentBreakdown(user);

      if (!breakdown) {
        setWarningData({
          type: 'noPricing',
          title: 'No Pricing Information',
          message: 'No pricing information available for breakdown.',
          icon: 'warning'
        });
        onWarningOpen();
        return;
      }

      if (breakdown.type === 'noMembership') {
        setWarningData({
          type: 'noMembership',
          title: 'Gym Membership Required',
          message: 'Please set up gym membership first before viewing payment breakdown.',
          submessage: 'Go to User Progress page to set up membership details.',
          icon: 'membership'
        });
        onWarningOpen();
        return;
      }

      setPaymentBreakdown(breakdown);
      setSelectedUser(user);
      onBreakdownOpen();
    } catch (error) {
      console.error('Error calculating payment breakdown:', error);
      alert('Error calculating payment breakdown. Please try again.');
    } finally {
      setLoadingBreakdown(false);
    }
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
            color="danger"
            startContent={<IconTrash size={16} />}
            onPress={handleClearAllRecords}
          >
            Clear All Records
          </Button>
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

      {/* Tabs */}
      <Card>
        <CardBody className="p-0">
          <div className="w-full">
            {/* Tab Headers */}
            <div className="flex border-b border-divider px-6 bg-content1">
              <button
                onClick={() => setActiveTab("user-payments")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 hover:text-primary ${
                  activeTab === "user-payments"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
              >
                <IconCreditCard size={18} />
                <span className="font-medium">User Payments</span>
              </button>

              <button
                onClick={() => setActiveTab("monthly-expenses")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 hover:text-primary ${
                  activeTab === "monthly-expenses"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
              >
                <IconCalculator size={18} />
                <span className="font-medium">Monthly Expenses</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
              {activeTab === "user-payments" && (
                <div className="p-6">
          {/* User Payments Content */}
          <div className="space-y-6 mt-6">
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
              <TableColumn className="min-w-[150px]">MEMBERSHIP</TableColumn>
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
                      {user.membershipAnalytics ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground leading-tight">
                              {user.membershipAnalytics.monthsTotal}M ({user.membershipAnalytics.totalDays}D)
                            </p>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={
                                user.membershipAnalytics.isExpired ? 'danger' :
                                user.membershipAnalytics.isPaused ? 'warning' :
                                user.membershipAnalytics.isUpcoming ? 'secondary' : 'success'
                              }
                            >
                              {user.membershipAnalytics.membershipStatus}
                            </Chip>
                          </div>
                          <p className="text-xs text-foreground-500 leading-tight">
                            {user.membershipAnalytics.isExpired ? 'Expired' :
                             user.membershipAnalytics.isUpcoming ? 'Upcoming' :
                             `${user.membershipAnalytics.daysRemaining} days left`}
                          </p>
                          {user.membershipAnalytics.perDayRate > 0 && (
                            <p className="text-xs text-foreground-400 leading-tight mt-0.5">
                              ₹{user.membershipAnalytics.perDayRate}/day
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-foreground-400">No membership</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      {(() => {
                        // Calculate per-period pricing
                        // Standard period price is ₹35,000 for 90 days
                        const totalPrice = user.discountedPrice || 0;
                        const standardPeriodPrice = 35000;
                        const standardPeriodDays = 90;

                        // Calculate number of periods based on price
                        const estimatedPeriods = Math.max(1, Math.round(totalPrice / standardPeriodPrice));
                        const perPeriodPrice = totalPrice / estimatedPeriods;

                        return (
                          <>
                            <p className="font-medium text-foreground leading-tight">
                              {formatCurrency(Math.round(perPeriodPrice))}
                            </p>
                            <p className="text-xs text-foreground-400 leading-tight mt-0.5">
                              Per {standardPeriodDays} days
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium text-success leading-tight">
                        {formatCurrency(user.totalAmountPaid)}
                      </p>
                      {user.membershipAnalytics && user.membershipAnalytics.paymentPercentage > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-success rounded-full transition-all"
                              style={{ width: `${Math.min(100, user.membershipAnalytics.paymentPercentage)}%` }}
                            />
                          </div>
                          <span className="text-xs text-foreground-500">
                            {user.membershipAnalytics.paymentPercentage.toFixed(0)}%
                          </span>
                        </div>
                      )}
                      {user.membershipAnalytics && user.membershipAnalytics.daysCoveredByPayments > 0 && (
                        <p className="text-xs text-foreground-400 leading-tight mt-0.5">
                          {user.membershipAnalytics.daysCoveredByPayments}D covered
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className={`font-medium leading-tight ${user.remainingAmount > 0 ? 'text-warning' : 'text-success'}`}>
                        {formatCurrency(user.remainingAmount)}
                      </p>
                      {user.membershipAnalytics && user.remainingAmount > 0 && (
                        <p className="text-xs text-foreground-500 leading-tight mt-0.5">
                          {Math.ceil(user.remainingAmount / (user.membershipAnalytics.perDayRate || 1))}D pending
                        </p>
                      )}
                      {user.membershipAnalytics && user.remainingAmount <= 0 && user.remainingAmount < 0 && (
                        <p className="text-xs text-success leading-tight mt-0.5">
                          {formatCurrency(Math.abs(user.remainingAmount))} credit
                        </p>
                      )}
                    </div>
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
                      {user.discountedPrice && user.discountedPrice > 0 && (
                        <Tooltip content="Payment Breakdown">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="secondary"
                            onPress={() => openPaymentBreakdown(user)}
                          >
                            <IconCalculator size={18} />
                          </Button>
                        </Tooltip>
                      )}
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
          </div>
                </div>
              )}

              {activeTab === "monthly-expenses" && (
                <div className="p-6">
          {/* Monthly Expenses Content */}
          <div className="space-y-6 mt-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Monthly Expenses & Budget</h2>
                <p className="text-foreground-500 mt-2">
                  Track income, expenses, and budget allocation for effective financial management.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="light"
                  startContent={<IconChevronLeft size={16} />}
                  onPress={() => navigateYear('prev')}
                  isIconOnly
                />
                <span className="text-lg font-semibold min-w-20 text-center">
                  {monthlyCurrentDate.getFullYear()}
                </span>
                <Button
                  variant="light"
                  startContent={<IconChevronRight size={16} />}
                  onPress={() => navigateYear('next')}
                  isIconOnly
                />
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<IconReportAnalytics size={16} />}
                  onPress={() => setMonthlyViewMode(monthlyViewMode === 'overview' ? 'detailed' : 'overview')}
                >
                  {monthlyViewMode === 'overview' ? 'Detailed View' : 'Overview'}
                </Button>
              </div>
            </div>

            {/* Professional Overview Mode with Analytics Dashboard */}
            {monthlyViewMode === 'overview' && (
              <div className="space-y-6">
                {monthlyLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-foreground-500">Loading monthly data...</p>
                  </div>
                ) : (
                  <>
                    {/* Financial Overview Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {(() => {
                        const totalRevenue = monthlyData.reduce((sum, month) => sum + month.totalIncome, 0);
                        const totalExpenses = monthlyExpenses.reduce((sum, month) => sum + month.totalExpenses, 0);
                        const netBalance = totalRevenue - totalExpenses;
                        const totalClients = monthlyData.reduce((sum, month) => sum + month.totalClients, 0);

                        return [
                          {
                            title: "Total Revenue",
                            value: formatCurrency(totalRevenue),
                            icon: <IconTrendingUp size={24} className="text-success" />,
                            color: "success",
                            subtext: `From ${totalClients} clients`
                          },
                          {
                            title: "Total Expenses",
                            value: formatCurrency(totalExpenses),
                            icon: <IconTrendingDown size={24} className="text-danger" />,
                            color: "danger",
                            subtext: `${monthlyExpenses.length} months tracked`
                          },
                          {
                            title: "Net Balance",
                            value: formatCurrency(netBalance),
                            icon: <IconChartBar size={24} className={netBalance >= 0 ? "text-success" : "text-danger"} />,
                            color: netBalance >= 0 ? "success" : "danger",
                            subtext: `${netBalance >= 0 ? "Profit" : "Loss"} for ${monthlyCurrentDate.getFullYear()}`
                          },
                          {
                            title: "Avg Monthly",
                            value: formatCurrency(totalRevenue / 12),
                            icon: <IconCalculator size={24} className="text-primary" />,
                            color: "primary",
                            subtext: "Revenue average"
                          }
                        ].map((stat, index) => (
                          <Card key={index} className="shadow-lg">
                            <CardBody className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-foreground-500 mb-1">{stat.title}</p>
                                  <p className={`text-xl font-bold text-${stat.color}`}>{stat.value}</p>
                                  <p className="text-xs text-foreground-400 mt-1">{stat.subtext}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-content2">
                                  {stat.icon}
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ));
                      })()}
                    </div>

                    {/* Professional Charts Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Revenue vs Expenses Chart */}
                      <Card className="shadow-lg">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <IconChartAreaFilled size={20} className="text-primary" />
                            <h4 className="font-semibold text-foreground">Revenue vs Expenses Trend</h4>
                          </div>
                        </CardHeader>
                        <CardBody>
                          <div className="h-72">
                            {(() => {
                              const chartData = Array.from({ length: 12 }, (_, monthIndex) => {
                                const monthName = getMonthName(monthIndex);
                                const monthData = monthlyData.find(m => {
                                  const monthDate = new Date(`${m.month} 1, ${m.year}`);
                                  return monthDate.getMonth() === monthIndex && m.year === monthlyCurrentDate.getFullYear();
                                });
                                const monthExpense = monthlyExpenses.find(e => {
                                  const monthDate = new Date(`${e.month} 1, ${e.year}`);
                                  return monthDate.getMonth() === monthIndex && e.year === monthlyCurrentDate.getFullYear();
                                });

                                return {
                                  month: monthName.substring(0, 3),
                                  revenue: monthData?.totalIncome || 0,
                                  expenses: monthExpense?.totalExpenses || 0,
                                  balance: (monthData?.totalIncome || 0) - (monthExpense?.totalExpenses || 0)
                                };
                              });

                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                      </linearGradient>
                                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <ChartTooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-content1 border border-divider rounded-lg p-3 shadow-lg">
                                              <p className="font-medium mb-2">{label}</p>
                                              {payload.map((entry, index) => (
                                                <p key={index} style={{ color: entry.color }} className="text-sm">
                                                  {entry.name}: {formatCurrency(entry.value as number)}
                                                </p>
                                              ))}
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="revenue"
                                      stackId="1"
                                      stroke="#10b981"
                                      fill="url(#revenueGradient)"
                                      name="Revenue"
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="expenses"
                                      stackId="2"
                                      stroke="#ef4444"
                                      fill="url(#expenseGradient)"
                                      name="Expenses"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        </CardBody>
                      </Card>

                      {/* Monthly Balance Chart */}
                      <Card className="shadow-lg">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <IconChartBar size={20} className="text-primary" />
                            <h4 className="font-semibold text-foreground">Monthly Net Balance</h4>
                          </div>
                        </CardHeader>
                        <CardBody>
                          <div className="h-72">
                            {(() => {
                              const balanceData = Array.from({ length: 12 }, (_, monthIndex) => {
                                const monthName = getMonthName(monthIndex);
                                const monthData = monthlyData.find(m => {
                                  const monthDate = new Date(`${m.month} 1, ${m.year}`);
                                  return monthDate.getMonth() === monthIndex && m.year === monthlyCurrentDate.getFullYear();
                                });
                                const monthExpense = monthlyExpenses.find(e => {
                                  const monthDate = new Date(`${e.month} 1, ${e.year}`);
                                  return monthDate.getMonth() === monthIndex && e.year === monthlyCurrentDate.getFullYear();
                                });

                                const balance = (monthData?.totalIncome || 0) - (monthExpense?.totalExpenses || 0);
                                return {
                                  month: monthName.substring(0, 3),
                                  balance: balance,
                                  isProfit: balance >= 0
                                };
                              });

                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={balanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <ChartTooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          const balance = payload[0].value as number;
                                          return (
                                            <div className="bg-content1 border border-divider rounded-lg p-3 shadow-lg">
                                              <p className="font-medium mb-1">{label}</p>
                                              <p className={`text-sm ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
                                                Balance: {formatCurrency(balance)}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Bar
                                      dataKey="balance"
                                      fill="#10b981"
                                      name="Net Balance"
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    {/* Cash Flow Scenarios Analysis */}
                    <Card className="shadow-lg">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <IconReportAnalytics size={20} className="text-primary" />
                          <h4 className="font-semibold text-foreground">Cash Flow Analysis & Scenarios</h4>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {(() => {
                            // Calculate real year-to-date cash flow scenarios
                            const calculateYearCashFlowScenarios = () => {
                              const currentDate = nowIST();
                              const currentYear = monthlyCurrentDate.getFullYear();

                              let totalOnTimePayments = 0;
                              let totalLatePayments = 0;
                              let totalPrepaidPayments = 0;
                              let totalRefunds = 0;

                              let onTimeClients = new Set();
                              let lateClients = new Set();
                              let prepaidClients = new Set();
                              let refundClients = new Set();

                              // Analyze all months in the current year
                              monthlyData.forEach(month => {
                                if (month.year !== currentYear) return;

                                month.users.forEach((user: any) => {
                                  const paymentBreakdown = user.paymentBreakdown;
                                  if (!paymentBreakdown) return;

                                  const allocatedAmount = paymentBreakdown.allocatedAmount || 0;
                                  const paidAmount = paymentBreakdown.paidAmount || 0;
                                  const monthlyPayments = user.monthlyPayments || [];

                                  // Calculate refunds for cancelled users
                                  if (user.membershipStatus === 'CANCELLED' || user.membershipStatus === 'EXPIRED') {
                                    const excessPayment = Math.max(0, paidAmount - allocatedAmount);
                                    totalRefunds += excessPayment;
                                    if (excessPayment > 0) {
                                      refundClients.add(user.userId);
                                    }
                                    return;
                                  }

                                  // Analyze payment timing
                                  const monthDate = new Date(`${month.month} 1, ${month.year}`);
                                  const monthStart = new Date(month.year, monthDate.getMonth(), 1);
                                  const dueDate = new Date(monthStart);
                                  dueDate.setDate(15); // Due by 15th

                                  monthlyPayments.forEach((payment: any) => {
                                    const paymentDate = new Date(payment.paymentDate);

                                    if (paymentDate <= dueDate) {
                                      totalOnTimePayments += payment.amount;
                                      onTimeClients.add(user.userId);
                                    } else {
                                      totalLatePayments += payment.amount;
                                      lateClients.add(user.userId);
                                    }
                                  });

                                  // Check for prepaid amounts
                                  if (paidAmount > allocatedAmount) {
                                    const prepaidAmount = paidAmount - allocatedAmount;
                                    totalPrepaidPayments += prepaidAmount;
                                    prepaidClients.add(user.userId);
                                  }
                                });
                              });

                              return {
                                onTime: {
                                  amount: totalOnTimePayments,
                                  clients: onTimeClients.size,
                                  percentage: totalOnTimePayments / (totalOnTimePayments + totalLatePayments) * 100 || 0
                                },
                                late: {
                                  amount: totalLatePayments,
                                  clients: lateClients.size,
                                  percentage: totalLatePayments / (totalOnTimePayments + totalLatePayments) * 100 || 0
                                },
                                prepaid: {
                                  amount: totalPrepaidPayments,
                                  clients: prepaidClients.size
                                },
                                refunds: {
                                  amount: totalRefunds,
                                  clients: refundClients.size
                                }
                              };
                            };

                            const yearData = calculateYearCashFlowScenarios();
                            const totalRevenue = yearData.onTime.amount + yearData.late.amount;

                            const scenarios = [
                              {
                                title: "On-Time Payments",
                                description: `${yearData.onTime.percentage.toFixed(1)}% of total revenue`,
                                icon: <IconCircleCheck size={20} className="text-success" />,
                                color: "success",
                                amount: yearData.onTime.amount,
                                status: yearData.onTime.percentage >= 90 ? "Excellent" : yearData.onTime.percentage >= 80 ? "Good" : "Needs Attention",
                                details: `₹${yearData.onTime.amount.toLocaleString()} from ${yearData.onTime.clients} clients`
                              },
                              {
                                title: "Late Payments",
                                description: `${yearData.late.percentage.toFixed(1)}% received late`,
                                icon: <IconClock size={20} className="text-warning" />,
                                color: "warning",
                                amount: yearData.late.amount,
                                status: yearData.late.percentage <= 10 ? "Excellent" : yearData.late.percentage <= 20 ? "Manageable" : "Concerning",
                                details: yearData.late.clients > 0 ? `₹${yearData.late.amount.toLocaleString()} from ${yearData.late.clients} clients` : "No late payments"
                              },
                              {
                                title: "Advance Payments",
                                description: "Prepaid for future periods",
                                icon: <IconCalendarEvent size={20} className="text-primary" />,
                                color: "primary",
                                amount: yearData.prepaid.amount,
                                status: yearData.prepaid.amount > 0 ? "Cash Flow Positive" : "Standard",
                                details: yearData.prepaid.clients > 0 ? `₹${yearData.prepaid.amount.toLocaleString()} from ${yearData.prepaid.clients} clients` : "No advance payments"
                              },
                              {
                                title: "Refunds Required",
                                description: "Cancellation adjustments",
                                icon: <IconReceiptTax size={20} className="text-danger" />,
                                color: "danger",
                                amount: yearData.refunds.amount,
                                status: yearData.refunds.amount > totalRevenue * 0.05 ? "High Impact" : "Minimal Impact",
                                details: yearData.refunds.clients > 0 ? `₹${yearData.refunds.amount.toLocaleString()} for ${yearData.refunds.clients} clients` : "No refunds required"
                              }
                            ];

                            return scenarios.map((scenario, index) => (
                              <Card key={index} className="border border-divider">
                                <CardBody className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg bg-${scenario.color}/10`}>
                                      {scenario.icon}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium text-sm mb-1">{scenario.title}</h5>
                                      <p className="text-xs text-foreground-500 mb-2">{scenario.description}</p>
                                      <p className={`text-lg font-bold text-${scenario.color} mb-1`}>
                                        {formatCurrency(scenario.amount)}
                                      </p>
                                      <Chip size="sm" color={scenario.color as "success" | "warning" | "primary" | "danger"} variant="flat">
                                        {scenario.status}
                                      </Chip>
                                      <p className="text-xs text-foreground-400 mt-2">{scenario.details}</p>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            ));
                          })()}
                        </div>
                      </CardBody>
                    </Card>

                    {/* Professional Monthly Grid */}
                    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10">
                              <IconCalendar size={24} className="text-primary" />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-foreground">Monthly Financial Overview</h4>
                              <p className="text-sm text-foreground-500">{monthlyCurrentDate.getFullYear()} • Real-time Analytics</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip
                              color="primary"
                              variant="solid"
                              size="sm"
                              className="shadow-lg"
                              startContent={<IconChartBar size={14} />}
                            >
                              Interactive Dashboard
                            </Chip>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {Array.from({ length: 12 }, (_, monthIndex) => {
                            const monthData = monthlyData.find(m => {
                              const monthDate = new Date(`${m.month} 1, ${m.year}`);
                              return monthDate.getMonth() === monthIndex && m.year === monthlyCurrentDate.getFullYear();
                            });

                            const monthExpenses = monthlyExpenses.find(e => {
                              const monthDate = new Date(`${e.month} 1, ${e.year}`);
                              return monthDate.getMonth() === monthIndex && e.year === monthlyCurrentDate.getFullYear();
                            });

                            const monthBalance = (monthData?.totalIncome || 0) - (monthExpenses?.totalExpenses || 0);
                            const profitMargin = monthData?.totalIncome ? ((monthBalance / monthData.totalIncome) * 100) : 0;
                            const currentMonth = nowIST().getMonth();
                            const isCurrentMonth = monthIndex === currentMonth;

                            return (
                              <Card
                                key={monthIndex}
                                className={`
                                  group cursor-pointer transition-all duration-300 ease-out
                                  hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl
                                  ${isCurrentMonth ? 'ring-2 ring-primary ring-opacity-50' : ''}
                                  ${monthData
                                    ? 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 dark:from-gray-900/50 dark:via-slate-900/50 dark:to-gray-900/50 border-gray-200 dark:border-gray-700'
                                    : 'bg-gradient-to-br from-gray-100 via-slate-100 to-gray-100 dark:from-gray-800/30 dark:via-slate-800/30 dark:to-gray-800/30 border-gray-300 dark:border-gray-600'
                                  }
                                  border-2
                                `}
                                isPressable
                                onPress={() => monthData && openMonthDetails(monthData)}
                              >
                                <CardBody className="p-0 relative overflow-hidden">
                                  {/* Background Pattern */}
                                  <div className="absolute inset-0 opacity-5">
                                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-current transform translate-x-8 -translate-y-8"></div>
                                    <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-current transform -translate-x-6 translate-y-6"></div>
                                  </div>

                                  <div className="relative p-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`
                                          w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                                          ${monthData
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                          }
                                        `}>
                                          {getMonthName(monthIndex).substring(0, 3)}
                                        </div>
                                        <div>
                                          <h5 className="font-bold text-lg text-foreground">{getMonthName(monthIndex)}</h5>
                                          {isCurrentMonth && (
                                            <span className="text-xs text-primary font-medium">Current Month</span>
                                          )}
                                        </div>
                                      </div>
                                      {monthData && (
                                        <div className="flex flex-col items-end gap-1">
                                          <Chip
                                            size="sm"
                                            color={monthBalance >= 0 ? "success" : "danger"}
                                            variant="shadow"
                                            className="font-bold"
                                          >
                                            {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                                          </Chip>
                                          <span className="text-xs text-foreground-400">Profit Margin</span>
                                        </div>
                                      )}
                                    </div>

                                    {monthData ? (
                                      <div className="space-y-4">
                                        {/* Financial Metrics */}
                                        <div className="space-y-3">
                                          {/* Revenue */}
                                          <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                            <div className="flex items-center gap-2">
                                              <IconTrendingUp size={16} className="text-success" />
                                              <span className="text-sm font-medium text-foreground-600">Revenue</span>
                                            </div>
                                            <span className="font-bold text-success">
                                              {formatCurrency(monthData.totalIncome)}
                                            </span>
                                          </div>

                                          {/* Expenses */}
                                          <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                            <div className="flex items-center gap-2">
                                              <IconTrendingDown size={16} className="text-danger" />
                                              <span className="text-sm font-medium text-foreground-600">Expenses</span>
                                            </div>
                                            <span className="font-bold text-danger">
                                              {formatCurrency(monthExpenses?.totalExpenses || 0)}
                                            </span>
                                          </div>

                                          {/* Expense Ratio Progress */}
                                          <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-foreground-500">
                                              <span>Expense Ratio</span>
                                              <span>{((monthExpenses?.totalExpenses || 0) / monthData.totalIncome * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                              <div
                                                className={`h-full rounded-full transition-all duration-700 ${
                                                  ((monthExpenses?.totalExpenses || 0) / monthData.totalIncome * 100) > 80
                                                    ? 'bg-gradient-to-r from-danger-400 to-danger-600'
                                                    : ((monthExpenses?.totalExpenses || 0) / monthData.totalIncome * 100) > 60
                                                    ? 'bg-gradient-to-r from-warning-400 to-warning-500'
                                                    : 'bg-gradient-to-r from-success-400 to-success-500'
                                                }`}
                                                style={{
                                                  width: `${Math.min(100, ((monthExpenses?.totalExpenses || 0) / monthData.totalIncome) * 100)}%`
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Net Balance */}
                                        <div className={`
                                          p-4 rounded-xl border-2 border-dashed
                                          ${monthBalance >= 0
                                            ? 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-700'
                                            : 'bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-700'
                                          }
                                        `}>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div className={`
                                                w-8 h-8 rounded-lg flex items-center justify-center
                                                ${monthBalance >= 0
                                                  ? 'bg-success-100 dark:bg-success-800'
                                                  : 'bg-danger-100 dark:bg-danger-800'
                                                }
                                              `}>
                                                {monthBalance >= 0 ? (
                                                  <IconChartBar size={16} className="text-success" />
                                                ) : (
                                                  <IconTrendingDown size={16} className="text-danger" />
                                                )}
                                              </div>
                                              <div>
                                                <p className="text-xs font-medium text-foreground-600">Net Balance</p>
                                                <p className="text-xs text-foreground-400">
                                                  {monthBalance >= 0 ? 'Profit' : 'Loss'}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <p className={`
                                                text-lg font-bold
                                                ${monthBalance >= 0
                                                  ? 'text-success'
                                                  : 'text-danger'
                                                }
                                              `}>
                                                {formatCurrency(monthBalance)}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Client Count */}
                                        <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                          <IconUsers size={16} className="text-primary" />
                                          <span className="text-sm font-semibold text-foreground">
                                            {monthData.totalClients} Active Clients
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-default-100 dark:bg-default-800 flex items-center justify-center mx-auto mb-3">
                                          <IconCalendar size={24} className="text-default-400" />
                                        </div>
                                        <h6 className="font-semibold text-foreground mb-1">No Activity</h6>
                                        <p className="text-sm text-foreground-400">No financial data recorded</p>
                                      </div>
                                    )}

                                    {/* Hover Indicator */}
                                    {monthData && (
                                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                          <IconChevronRight size={16} className="text-primary" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Summary Footer */}
                        <div className="mt-8 p-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-xl border border-primary/10">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                {monthlyData.filter(m => m.year === monthlyCurrentDate.getFullYear()).length}
                              </p>
                              <p className="text-sm text-foreground-500">Active Months</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-success">
                                {formatCurrency(monthlyData
                                  .filter(m => m.year === monthlyCurrentDate.getFullYear())
                                  .reduce((sum, m) => sum + m.totalIncome, 0)
                                )}
                              </p>
                              <p className="text-sm text-foreground-500">Total Revenue</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-danger">
                                {formatCurrency(monthlyExpenses
                                  .filter(e => e.year === monthlyCurrentDate.getFullYear())
                                  .reduce((sum, e) => sum + e.totalExpenses, 0)
                                )}
                              </p>
                              <p className="text-sm text-foreground-500">Total Expenses</p>
                            </div>
                            <div>
                              <p className={`
                                text-2xl font-bold
                                ${(monthlyData
                                  .filter(m => m.year === monthlyCurrentDate.getFullYear())
                                  .reduce((sum, m) => sum + m.totalIncome, 0) -
                                  monthlyExpenses
                                  .filter(e => e.year === monthlyCurrentDate.getFullYear())
                                  .reduce((sum, e) => sum + e.totalExpenses, 0)
                                ) >= 0 ? 'text-success' : 'text-danger'}
                              `}>
                                {formatCurrency(
                                  monthlyData
                                    .filter(m => m.year === monthlyCurrentDate.getFullYear())
                                    .reduce((sum, m) => sum + m.totalIncome, 0) -
                                  monthlyExpenses
                                    .filter(e => e.year === monthlyCurrentDate.getFullYear())
                                    .reduce((sum, e) => sum + e.totalExpenses, 0)
                                )}
                              </p>
                              <p className="text-sm text-foreground-500">Net Profit</p>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Enhanced Interactive Detailed View */}
            {monthlyViewMode === 'detailed' && (
              <div className="space-y-6">
                {/* Advanced Header with Interactive Controls */}
                <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border border-primary/10">
                  <CardHeader>
                    <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconReportAnalytics size={24} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Interactive Financial Dashboard</h3>
                          <p className="text-sm text-foreground-500">Comprehensive analysis for {monthlyCurrentDate.getFullYear()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2 p-1 bg-content2 rounded-lg">
                          <Button
                            size="sm"
                            variant={monthlyViewMode === 'detailed' ? 'solid' : 'light'}
                            color="primary"
                            className="min-w-0 px-3"
                          >
                            <IconChartBar size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="secondary"
                            onPress={() => setMonthlyViewMode('overview')}
                            className="min-w-0 px-3"
                          >
                            <IconChartPie size={16} />
                          </Button>
                        </div>

                        {/* Export Button */}
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<IconDownload size={16} />}
                        >
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Interactive Year Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const yearData = monthlyData.filter(m => m.year === monthlyCurrentDate.getFullYear());
                    const yearExpenses = monthlyExpenses.filter(e => e.year === monthlyCurrentDate.getFullYear());

                    const totalRevenue = yearData.reduce((sum, m) => sum + m.totalIncome, 0);
                    const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.totalExpenses, 0);
                    const netProfit = totalRevenue - totalExpenses;
                    const avgMonthlyRevenue = yearData.length > 0 ? totalRevenue / yearData.length : 0;

                    // Calculate real trends from previous year data
                    const calculateYearTrend = (currentValue: number, type: 'revenue' | 'expenses' | 'profit' | 'average') => {
                      const prevYearData = monthlyData.filter(m => m.year === monthlyCurrentDate.getFullYear() - 1);
                      const prevYearExpenses = monthlyExpenses.filter(e => e.year === monthlyCurrentDate.getFullYear() - 1);

                      let prevYearValue = 0;
                      switch (type) {
                        case 'revenue':
                          prevYearValue = prevYearData.reduce((sum, m) => sum + m.totalIncome, 0);
                          break;
                        case 'expenses':
                          prevYearValue = prevYearExpenses.reduce((sum, e) => sum + e.totalExpenses, 0);
                          break;
                        case 'profit':
                          const prevRevenue = prevYearData.reduce((sum, m) => sum + m.totalIncome, 0);
                          const prevExpenses = prevYearExpenses.reduce((sum, e) => sum + e.totalExpenses, 0);
                          prevYearValue = prevRevenue - prevExpenses;
                          break;
                        case 'average':
                          const prevTotalRevenue = prevYearData.reduce((sum, m) => sum + m.totalIncome, 0);
                          prevYearValue = prevYearData.length > 0 ? prevTotalRevenue / prevYearData.length : 0;
                          break;
                      }

                      if (prevYearValue === 0) return "N/A";
                      const trend = ((currentValue - prevYearValue) / prevYearValue) * 100;
                      return `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
                    };

                    const summaryCards = [
                      {
                        title: "Annual Revenue",
                        value: totalRevenue,
                        icon: <IconTrendingUp size={24} className="text-success" />,
                        color: "success",
                        trend: calculateYearTrend(totalRevenue, 'revenue'),
                        description: "Total income this year"
                      },
                      {
                        title: "Total Expenses",
                        value: totalExpenses,
                        icon: <IconTrendingDown size={24} className="text-danger" />,
                        color: "danger",
                        trend: calculateYearTrend(totalExpenses, 'expenses'),
                        description: "Total costs this year"
                      },
                      {
                        title: "Net Profit",
                        value: netProfit,
                        icon: <IconCurrencyRupee size={24} className="text-primary" />,
                        color: netProfit >= 0 ? "primary" : "warning",
                        trend: calculateYearTrend(netProfit, 'profit'),
                        description: "Annual profit margin"
                      },
                      {
                        title: "Avg Monthly",
                        value: avgMonthlyRevenue,
                        icon: <IconCalculator size={24} className="text-secondary" />,
                        color: "secondary",
                        trend: calculateYearTrend(avgMonthlyRevenue, 'average'),
                        description: "Average monthly revenue"
                      }
                    ];

                    return summaryCards.map((card, index) => (
                      <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-divider hover:border-primary/20">
                        <CardBody className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-${card.color}/10 group-hover:scale-110 transition-transform duration-300`}>
                              {card.icon}
                            </div>
                            <Chip
                              size="sm"
                              color={card.trend === "N/A" ? 'default' : card.trend.startsWith('+') ? 'success' : 'danger'}
                              variant="flat"
                              className="group-hover:scale-105 transition-transform duration-300"
                            >
                              {card.trend}
                            </Chip>
                          </div>
                          <h4 className="text-sm font-medium text-foreground-600 mb-1">{card.title}</h4>
                          <p className={`text-2xl font-bold text-${card.color} mb-2 group-hover:scale-105 transition-transform duration-300`}>
                            {formatCurrency(card.value)}
                          </p>
                          <p className="text-xs text-foreground-400">{card.description}</p>
                        </CardBody>
                      </Card>
                    ));
                  })()}
                </div>

                {/* Interactive Monthly Performance Grid */}
                <Card className="shadow-xl bg-content1">
                  <CardHeader className="border-b border-divider">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">Monthly Performance Analytics</h4>
                        <p className="text-sm text-foreground-500">Interactive month-by-month breakdown with detailed insights</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Performance Filter */}
                        <Select
                          size="sm"
                          placeholder="Filter by performance"
                          className="min-w-40"
                          variant="bordered"
                          selectedKeys={[detailedPerformanceFilter]}
                          onSelectionChange={(keys) => setDetailedPerformanceFilter(Array.from(keys)[0] as string)}
                        >
                          <SelectItem key="all">All Months</SelectItem>
                          <SelectItem key="profitable">Profitable Only</SelectItem>
                          <SelectItem key="loss">Loss Making</SelectItem>
                          <SelectItem key="high-margin">High Margin (&gt;20%)</SelectItem>
                        </Select>

                        {/* Sort Options */}
                        <Select
                          size="sm"
                          placeholder="Sort by"
                          className="min-w-32"
                          variant="bordered"
                          selectedKeys={[detailedSortBy]}
                          onSelectionChange={(keys) => setDetailedSortBy(Array.from(keys)[0] as string)}
                        >
                          <SelectItem key="month">Month</SelectItem>
                          <SelectItem key="revenue">Revenue</SelectItem>
                          <SelectItem key="profit">Profit</SelectItem>
                          <SelectItem key="margin">Margin %</SelectItem>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>

                  <CardBody className="p-0">
                    {monthlyLoading ? (
                      <div className="text-center py-16">
                        <div className="relative mx-auto w-16 h-16 mb-6">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20"></div>
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent absolute top-0"></div>
                        </div>
                        <h5 className="text-lg font-semibold text-foreground mb-2">Analyzing Financial Data</h5>
                        <p className="text-foreground-500">Processing detailed monthly analytics...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                        {(() => {
                          // Create and process monthly data
                          const monthsData = Array.from({ length: 12 }, (_, monthIndex) => {
                            const monthName = getMonthName(monthIndex);
                            const monthData = monthlyData.find(m => {
                              const monthDate = new Date(`${m.month} 1, ${m.year}`);
                              return monthDate.getMonth() === monthIndex && m.year === monthlyCurrentDate.getFullYear();
                            });

                            const monthExpenses = monthlyExpenses.find(e => {
                              const monthDate = new Date(`${e.month} 1, ${e.year}`);
                              return monthDate.getMonth() === monthIndex && e.year === monthlyCurrentDate.getFullYear();
                            });

                            const revenue = monthData?.totalIncome || 0;
                            const expenses = monthExpenses?.totalExpenses || 0;
                            const profit = revenue - expenses;
                            const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;
                            const clients = monthData?.totalClients || 0;

                            return {
                              monthIndex,
                              monthName,
                              monthData,
                              monthExpenses,
                              revenue,
                              expenses,
                              profit,
                              margin,
                              clients,
                              hasData: revenue > 0 || expenses > 0
                            };
                          });

                          // Apply filtering
                          let filteredMonths = monthsData;
                          if (detailedPerformanceFilter !== "all") {
                            filteredMonths = monthsData.filter(month => {
                              switch (detailedPerformanceFilter) {
                                case "profitable":
                                  return month.hasData && month.profit >= 0;
                                case "loss":
                                  return month.hasData && month.profit < 0;
                                case "high-margin":
                                  return month.hasData && month.margin > 20;
                                default:
                                  return true;
                              }
                            });
                          }

                          // Apply sorting
                          if (detailedSortBy !== "month") {
                            filteredMonths.sort((a, b) => {
                              switch (detailedSortBy) {
                                case "revenue":
                                  return b.revenue - a.revenue;
                                case "profit":
                                  return b.profit - a.profit;
                                case "margin":
                                  return b.margin - a.margin;
                                default:
                                  return a.monthIndex - b.monthIndex;
                              }
                            });
                          }

                          return filteredMonths.map((month) => {
                            const { monthIndex, monthName, monthData, revenue, expenses, profit, margin, clients, hasData } = month;

                            // Calculate performance metrics
                            const revenueGrowth = monthIndex > 0 ?
                              (() => {
                                const prevMonthData = monthlyData.find(m => {
                                  const monthDate = new Date(`${m.month} 1, ${m.year}`);
                                  return monthDate.getMonth() === (monthIndex - 1) && m.year === monthlyCurrentDate.getFullYear();
                                });
                                const prevRevenue = prevMonthData?.totalIncome || 0;
                                return prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue * 100) : 0;
                              })() : 0;

                            const currentMonth = nowIST().getMonth();
                            const isFutureMonth = monthIndex > currentMonth && monthlyCurrentDate.getFullYear() === nowIST().getFullYear();

                          return (
                            <Card
                              key={monthIndex}
                              className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border ${
                                hasData
                                  ? profit >= 0
                                    ? 'border-success/20 hover:border-success/40 bg-gradient-to-br from-success/5 to-transparent'
                                    : 'border-warning/20 hover:border-warning/40 bg-gradient-to-br from-warning/5 to-transparent'
                                  : isFutureMonth
                                    ? 'border-dashed border-default-200 bg-default-50 dark:bg-default-900/50'
                                    : 'border-danger/20 hover:border-danger/40 bg-gradient-to-br from-danger/5 to-transparent'
                              }`}
                              isPressable={hasData}
                              onPress={() => hasData && openMonthDetails(monthData!)}
                            >
                              <CardBody className="p-6">
                                {/* Month Header */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      hasData
                                        ? profit >= 0
                                          ? 'bg-success/10'
                                          : 'bg-warning/10'
                                        : 'bg-default/10'
                                    } group-hover:scale-110 transition-transform duration-300`}>
                                      <IconCalendar size={20} className={
                                        hasData
                                          ? profit >= 0
                                            ? 'text-success'
                                            : 'text-warning'
                                          : 'text-default-400'
                                      } />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-foreground">{monthName}</h5>
                                      <p className="text-xs text-foreground-500">
                                        {isFutureMonth ? 'Upcoming' : hasData ? 'Active' : 'No Data'}
                                      </p>
                                    </div>
                                  </div>

                                  {hasData && (
                                    <div className="flex items-center gap-2">
                                      <Chip
                                        size="sm"
                                        color={margin >= 20 ? 'success' : margin >= 10 ? 'warning' : margin < 0 ? 'danger' : 'default'}
                                        variant="flat"
                                        className="group-hover:scale-105 transition-transform duration-300"
                                      >
                                        {margin.toFixed(1)}%
                                      </Chip>
                                      {revenueGrowth !== 0 && (
                                        <Chip
                                          size="sm"
                                          color={revenueGrowth > 0 ? 'success' : 'danger'}
                                          variant="dot"
                                          className="group-hover:scale-105 transition-transform duration-300"
                                        >
                                          {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                                        </Chip>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {hasData ? (
                                  <>
                                    {/* Financial Metrics */}
                                    <div className="space-y-3 mb-4">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground-600">Revenue</span>
                                        <span className="font-bold text-success text-lg">{formatCurrency(revenue)}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground-600">Expenses</span>
                                        <span className="font-bold text-danger">{formatCurrency(expenses)}</span>
                                      </div>
                                      <div className="border-t border-divider pt-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-bold text-foreground">Net Profit</span>
                                          <span className={`font-bold text-lg ${profit >= 0 ? 'text-primary' : 'text-warning'}`}>
                                            {formatCurrency(profit)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Performance Bar */}
                                    <div className="mb-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-foreground-600">Profit Margin</span>
                                        <span className="text-xs font-bold text-foreground">{margin.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full bg-default-200 rounded-full h-2 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            margin >= 20 ? 'bg-success' : margin >= 10 ? 'bg-warning' : 'bg-danger'
                                          }`}
                                          style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Client Info & Action */}
                                    <div className="flex items-center justify-between pt-3 border-t border-divider">
                                      <div className="flex items-center gap-2">
                                        <IconUsers size={16} className="text-primary" />
                                        <span className="text-sm font-medium text-foreground">
                                          {clients} client{clients !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="flex items-center gap-1 text-primary">
                                          <span className="text-sm font-medium">View Details</span>
                                          <IconChevronRight size={16} />
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-8">
                                    <div className={`w-12 h-12 rounded-full ${
                                      isFutureMonth ? 'bg-default-100' : 'bg-danger/10'
                                    } flex items-center justify-center mx-auto mb-3`}>
                                      {isFutureMonth ? (
                                        <IconClock size={20} className="text-default-400" />
                                      ) : (
                                        <IconAlertCircle size={20} className="text-danger" />
                                      )}
                                    </div>
                                    <h6 className="font-semibold text-foreground mb-1">
                                      {isFutureMonth ? 'Upcoming Month' : 'No Activity'}
                                    </h6>
                                    <p className="text-sm text-foreground-400">
                                      {isFutureMonth ? 'Future planning period' : 'No financial data recorded'}
                                    </p>
                                  </div>
                                )}
                              </CardBody>
                            </Card>
                          );
                        });
                        })()}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
                </div>
              )}
            </div>
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
                  color="danger"
                  startContent={<IconTrash size={16} />}
                  onPress={() => handleDeleteAllUserPayments(selectedUser)}
                  className="flex-1"
                >
                  Clear Payments
                </Button>
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
                {/* Pricing Breakdown */}
                {selectedUser.membershipAnalytics && (
                  <div className="mb-6">
                    <h5 className="font-medium text-sm text-foreground-600 mb-3">Pricing Breakdown</h5>
                    <div className="bg-content1 rounded-lg p-4 space-y-3">
                      {/* Original Membership */}
                      <div className="flex justify-between items-center pb-2 border-b border-divider">
                        <div>
                          <p className="text-sm font-medium">Original Membership</p>
                          <p className="text-xs text-foreground-500">
                            {selectedUser.membershipAnalytics.monthsTotal} months ({Math.round(selectedUser.membershipAnalytics.monthsTotal * 30)} days)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {selectedUser.packagePrice ? formatCurrency(selectedUser.packagePrice) : '₹0'}
                          </p>
                          {selectedUser.membershipAnalytics.setupDiscount > 0 && (
                            <p className="text-xs text-success">
                              -{selectedUser.membershipAnalytics.discountPercentage.toFixed(1)}% discount
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Extensions (if any) */}
                      {selectedUser.membershipAnalytics.totalDays !== Math.round(selectedUser.membershipAnalytics.monthsTotal * 30) && (
                        <div className="flex justify-between items-center pb-2 border-b border-divider">
                          <div>
                            <p className="text-sm font-medium text-primary">Extensions Applied</p>
                            <p className="text-xs text-foreground-500">
                              Additional {selectedUser.membershipAnalytics.totalDays - Math.round(selectedUser.membershipAnalytics.monthsTotal * 30)} days
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">
                              ₹{((selectedUser.discountedPrice || 0) - (selectedUser.packagePrice || 0) + (selectedUser.membershipAnalytics.setupDiscount || 0)).toFixed(0)}
                            </p>
                            <p className="text-xs text-foreground-500">
                              @ ₹{selectedUser.membershipAnalytics.perDayRate}/day
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Offered Price (Original) */}
                      <div className="flex justify-between items-center pt-2">
                        <div>
                          <p className="text-sm font-bold text-success">Offered Price (Original)</p>
                          <p className="text-xs text-foreground-500">
                            Initial price offered to customer
                          </p>
                        </div>
                        <p className="text-lg font-bold text-success">
                          {(() => {
                            // Calculate current membership offered price
                            // If packagePrice exists, use that as base, otherwise use discountedPrice
                            const basePrice = selectedUser.packagePrice || selectedUser.discountedPrice || 0;
                            // For current membership, show the package price or a reasonable offered price
                            const offeredPrice = selectedUser.discountedPrice || basePrice; // Use actual discounted price
                            return formatCurrency(offeredPrice);
                          })()}
                        </p>
                      </div>

                      {/* Monthly Breakdown */}
                      <div className="bg-content2 rounded-lg p-3 border-t border-divider">
                        <p className="text-xs font-medium text-foreground-600 mb-2">Rate Information:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-foreground-500">Per Month:</span>
                            <span className="font-medium ml-1">₹{(() => {
                              // Calculate per month for current membership using actual pricing
                              const currentMembershipPrice = selectedUser.discountedPrice || selectedUser.packagePrice || 0;
                              const monthsTotal = selectedUser.membershipAnalytics.totalDays / 30;
                              return monthsTotal > 0 ? (currentMembershipPrice / monthsTotal).toFixed(0) : '0';
                            })()}</span>
                          </div>
                          <div>
                            <span className="text-foreground-500">Per Day:</span>
                            <span className="font-medium ml-1">₹{(() => {
                              // Calculate per day for current membership using actual pricing
                              const currentMembershipPrice = selectedUser.discountedPrice || selectedUser.packagePrice || 0;
                              const totalDays = selectedUser.membershipAnalytics.totalDays;
                              return totalDays > 0 ? (currentMembershipPrice / totalDays).toFixed(2) : '0';
                            })()}</span>
                          </div>
                        </div>
                      </div>

                     

                      {/* Total Membership Value (for reference) */}
                      <div className="flex justify-between items-center py-2 bg-content2 px-3 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-foreground-600">Total Membership Value</p>
                          <p className="text-xs text-foreground-500">
                            {selectedUser.membershipAnalytics.totalDays} days total (calculated)
                          </p>
                        </div>
                        <p className="text-lg font-bold text-foreground-600">
                          {(() => {
                            // Show current membership value using actual pricing
                            const currentMembershipValue = selectedUser.discountedPrice || selectedUser.packagePrice || 0;
                            return formatCurrency(currentMembershipValue);
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Status Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Amount Paid - Clickable */}
                  <div
                    className="p-3 bg-content1 rounded-lg cursor-pointer hover:bg-content2 transition-colors group"
                    onClick={async () => {
                      // Show payment breakdown modal
                      setLoadingBreakdown(true);
                      try {
                        const breakdown = await calculatePaymentBreakdown(selectedUser);
                        setPaymentBreakdown(breakdown);
                        onBreakdownOpen();
                      } catch (error) {
                        console.error('Error calculating payment breakdown:', error);
                      } finally {
                        setLoadingBreakdown(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconCircleCheck size={14} className="text-success" />
                      <span className="text-xs text-foreground-500">Amount Paid</span>
                      <IconChevronRight size={12} className="text-foreground-400 ml-auto group-hover:text-foreground-600 transition-colors" />
                    </div>
                    <p className="text-lg font-bold text-success">
                      {formatCurrency(selectedUser.totalAmountPaid)}
                    </p>
                    {selectedUser.membershipAnalytics && (
                      <p className="text-xs text-foreground-500 mt-1">
                        {getCorrectAnalytics(selectedUser)?.paymentPercentage.toFixed(1)}% completed
                      </p>
                    )}
                  </div>

                  {/* Remaining Amount */}
                  <div className="p-3 bg-content1 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconAlertCircle size={14} className="text-warning" />
                      <span className="text-xs text-foreground-500">Remaining</span>
                    </div>
                    <p className={`text-lg font-bold ${(getCorrectAnalytics(selectedUser)?.correctRemainingAmount || 0) > 0 ? 'text-warning' : 'text-success'}`}>
                      {formatCurrency(getCorrectAnalytics(selectedUser)?.correctRemainingAmount || selectedUser.remainingAmount)}
                    </p>
                    {selectedUser.membershipAnalytics && (
                      <p className="text-xs text-foreground-500 mt-1">
                        {getCorrectAnalytics(selectedUser)?.daysCoveredByPayments} days covered
                      </p>
                    )}
                  </div>

                  {/* Days Remaining */}
                  {selectedUser.membershipAnalytics && (
                    <div className="p-3 bg-content1 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconCalendarDue size={14} className={selectedUser.membershipAnalytics.isExpired ? "text-danger" : "text-info"} />
                        <span className="text-xs text-foreground-500">Days Left</span>
                      </div>
                      <p className={`text-lg font-bold ${selectedUser.membershipAnalytics.isExpired ? "text-danger" : "text-info"}`}>
                        {selectedUser.membershipAnalytics.isExpired ? 'Expired' : getCorrectAnalytics(selectedUser)?.correctDaysRemaining || selectedUser.membershipAnalytics.daysRemaining}
                      </p>
                      <p className="text-xs text-foreground-500 mt-1">
                        of {selectedUser.membershipAnalytics.totalDays} total days
                      </p>
                    </div>
                  )}
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
        title={selectedUser ? `Payment History - ${selectedUser.userName}` : "Payment History"}
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
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDeletePayment(log.id, log.amount)}
                          >
                            <IconTrash size={16} />
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
        onClose={handlePricingClose}
        title="Setup Payment Pricing"
        size="4xl"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onPress={handlePricingClose} className="flex-1">
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
        <div className="space-y-6">
          {/* Membership Setup */}
          <div>
            <h5 className="font-medium text-sm text-foreground-700 mb-3">Membership Setup</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Package Price (₹)"
                placeholder="45000"
                value={packagePrice}
                onChange={(e) => handlePackagePriceChange(e.target.value)}
                description="Total price for the membership"
                min="1"
              />
              <Input
                type="number"
                label="Membership Duration (Months)"
                placeholder="3"
                value={membershipMonths}
                onChange={(e) => handleMonthsChange(e.target.value)}
                description="Number of months for membership"
                min="1"
                max="24"
              />
            </div>

          </div>


          {/* Final Pricing */}
          <div>
            <h5 className="font-medium text-sm text-foreground-700 mb-3">Final Pricing</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Final Total Price (₹)"
                placeholder="45000"
                value={discountedPrice}
                onChange={(e) => handleFinalPriceChange(e.target.value)}
                description="Final price after any discounts"
              />
              {membershipMonths && discountedPrice && (
                <Input
                  type="number"
                  label="Price Per Month (₹)"
                  value={pricePerMonth}
                  isReadOnly
                  description="Auto-calculated from final pricing and duration"
                  classNames={{
                    input: "bg-content2 text-foreground-500",
                    inputWrapper: "bg-content2"
                  }}
                />
              )}
            </div>
          </div>

          {/* Calculated Pricing - moved below Final Pricing */}
          {membershipMonths && discountedPrice && (
            <div className="bg-content2 rounded-lg p-4">
              <h5 className="font-medium text-sm text-foreground-700 mb-3">Calculated Pricing</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-content1 rounded-lg p-3">
                  <p className="text-xs text-foreground-500 mb-1">Package Price (Total)</p>
                  <p className="text-lg font-bold text-foreground">₹{formatCurrency(parseInt(discountedPrice) || 0).replace('₹', '')}</p>
                  <p className="text-xs text-foreground-400">{membershipMonths} months × ₹{parseInt(pricePerMonth).toLocaleString()}</p>
                </div>
                <div className="bg-content1 rounded-lg p-3">
                  <p className="text-xs text-foreground-500 mb-1">Per Day Rate</p>
                  <p className="text-lg font-bold text-foreground">₹{((parseInt(discountedPrice) || 0) / (parseInt(membershipMonths) * 30)).toFixed(0)}</p>
                  <p className="text-xs text-foreground-400">Based on 30 days/month</p>
                </div>
              </div>
            </div>
          )}

          {/* Discount Calculation */}
          {packagePrice && discountedPrice && parseFloat(packagePrice) !== parseFloat(discountedPrice) && (
            <div className="mt-3 p-3 bg-success-50 border border-success-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <IconCurrencyRupee size={16} className="text-success-600" />
                <span className="text-sm font-medium text-success-700">Discount Applied</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-foreground-500">Discount Amount:</span>
                  <span className="font-medium ml-1 text-success-600">
                    ₹{(parseFloat(packagePrice) - parseFloat(discountedPrice)).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-foreground-500">Discount %:</span>
                  <span className="font-medium ml-1 text-success-600">
                    {(((parseFloat(packagePrice) - parseFloat(discountedPrice)) / parseFloat(packagePrice)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Notes */}
          <div>
            <Input
              label="Payment Notes"
              placeholder="Special payment arrangements or notes..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              description="Optional notes about payment arrangements"
            />
          </div>
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
            onChange={(date) => setPaymentDate(date || nowIST())}
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
        title={editingPayment ? `Edit Payment - ${formatCurrency(editingPayment.amount)}` : "Edit Payment"}
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
              onChange={(date) => setEditPaymentDate(date || nowIST())}
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

      {/* Payment Breakdown Modal */}
      <BottomSheet
        isOpen={isBreakdownOpen}
        onClose={onBreakdownClose}
        title={selectedUser ? `Payment Breakdown - ${selectedUser.userName}` : "Payment Breakdown"}
        size="4xl"
        scrollBehavior="inside"
      >
        <div className="space-y-4 p-2 max-h-[70vh] overflow-y-auto">
          {loadingBreakdown ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground-500">Calculating payment breakdown...</p>
            </div>
          ) : !paymentBreakdown ? (
            <div className="text-center py-8">
              <IconAlertCircle size={48} className="text-warning mx-auto mb-4" />
              <p className="text-foreground-500">No breakdown data available.</p>
            </div>
          ) : paymentBreakdown.type === 'noMembership' ? (
            <div className="text-center py-8">
              <IconAlertCircle size={48} className="text-warning mx-auto mb-4" />
              <div className="space-y-4">
                <p className="text-lg font-medium text-foreground">Gym Membership Required</p>
                <p className="text-foreground-500">{paymentBreakdown.message}</p>
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-sm text-warning">
                    💡 <strong>How to fix:</strong> Go to the User Progress page and set up the gym membership details
                    including start date, duration, and membership status for this user.
                  </p>
                </div>
              </div>
            </div>
          ) : (
              <>
                {/* Enhanced Summary Section with Membership Analytics */}
                <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                  <CardBody className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <p className="text-sm text-foreground-500">Client Information</p>
                        <div className="flex items-center gap-3">
                          <Avatar src={selectedUser?.userImageUrl} name={selectedUser?.userName} size="sm" />
                          <div>
                            <p className="text-lg font-bold text-foreground">{paymentBreakdown.userName}</p>
                            <p className="text-sm text-foreground-500">{selectedUser?.userEmail}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground-500">Package Pricing (Per Period)</p>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-primary">
                            ₹{paymentBreakdown.membershipBreakdown && paymentBreakdown.membershipBreakdown.length > 0
                              ? paymentBreakdown.membershipBreakdown[0].packagePrice?.toLocaleString()
                              : '0'}
                          </p>
                          <p className="text-xs text-foreground-400">
                            For {paymentBreakdown.membershipBreakdown?.[0]?.duration || 0} days membership
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Membership Analytics Grid */}
                    {selectedUser?.membershipAnalytics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-divider">
                        <div className="text-center">
                          <p className="text-sm text-foreground-500">Duration</p>
                          <p className="text-lg font-semibold text-foreground">
                            {selectedUser.membershipAnalytics.monthsTotal}M {selectedUser.membershipAnalytics.totalDays}D
                          </p>
                          <p className="text-xs text-foreground-400">Total membership</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-foreground-500">Per Day Rate</p>
                          <p className="text-lg font-semibold text-primary">₹{selectedUser.membershipAnalytics.perDayRate}</p>
                          <p className="text-xs text-foreground-400">Daily cost</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-foreground-500">Days Covered</p>
                          <p className="text-lg font-semibold text-success">{selectedUser.membershipAnalytics.daysCoveredByPayments}D</p>
                          <p className="text-xs text-foreground-400">By payments</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-foreground-500">Remaining</p>
                          <p className="text-lg font-semibold text-warning">{selectedUser.membershipAnalytics.daysRemaining}D</p>
                          <p className="text-xs text-foreground-400">Days left</p>
                        </div>
                      </div>
                    )}

                    {/* Payment Progress Bar */}
                    {selectedUser?.membershipAnalytics && (
                      <div className="mt-4 pt-4 border-t border-divider">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-foreground-500">Payment Progress</p>
                          <p className="text-sm font-medium text-foreground">{selectedUser.membershipAnalytics.paymentPercentage.toFixed(1)}%</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, selectedUser.membershipAnalytics.paymentPercentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-foreground-500 mt-1">
                          <span>₹{selectedUser.totalAmountPaid?.toLocaleString()} paid</span>
                          <span>₹{selectedUser.remainingAmount?.toLocaleString()} remaining</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-divider">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-foreground-500 mb-1">Membership Period</p>
                          <p className="text-sm text-foreground">{paymentBreakdown.membershipInfo?.startDate} → {paymentBreakdown.membershipInfo?.endDate}</p>
                          {selectedUser?.membershipAnalytics && (
                            <div className="flex items-center gap-2 mt-1">
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  selectedUser.membershipAnalytics.isExpired ? 'danger' :
                                  selectedUser.membershipAnalytics.isPaused ? 'warning' :
                                  selectedUser.membershipAnalytics.isUpcoming ? 'secondary' : 'success'
                                }
                              >
                                {selectedUser.membershipAnalytics.membershipStatus}
                              </Chip>
                              {selectedUser.membershipAnalytics.pausedDays > 0 && (
                                <span className="text-xs text-foreground-500">
                                  {selectedUser.membershipAnalytics.pausedDays}D paused
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-foreground-500 mb-1">Payment Summary</p>
                          <div className="space-y-1">
                            <p className="text-sm text-foreground">{paymentBreakdown.paymentStats?.totalPayments} payments made</p>
                            <p className="text-sm text-foreground">Avg: ₹{paymentBreakdown.paymentStats?.averagePayment?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Membership-wise Payment Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <IconCalendarDue size={20} className="text-primary" />
                    Payment Details by Membership Period
                  </h4>

                  <div className="space-y-3">
                    {paymentBreakdown.membershipBreakdown?.map((period: any, index: number) => (
                      <Card key={index} className="border border-divider">
                        <CardBody className="p-4">
                          <div className="space-y-3">
                            {/* Period Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-bold text-foreground">Membership Period {period.periodNumber}</h5>
                                  <Chip size="sm" variant="flat" color={
                                    period.status === 'ACTIVE' ? 'success' :
                                    period.status === 'EXPIRED' ? 'danger' :
                                    period.status === 'PAUSED' ? 'warning' : 'default'
                                  }>
                                    {period.status}
                                  </Chip>
                                </div>
                                <p className="text-sm text-foreground-500">
                                  {period.startDate} → {period.endDate}
                                </p>
                                <p className="text-xs text-foreground-400 mt-1">
                                  Duration: {period.duration} days • ₹{period.perDayRate}/day
                                </p>
                                {period.notes && (
                                  <p className="text-xs text-foreground-400 mt-1 italic">
                                    Note: {period.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Payment Progress Bar */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-foreground-500">Payment Progress</p>
                                <p className="text-sm font-medium text-foreground">{period.paymentProgress}%</p>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    period.paymentProgress === 100 ? 'bg-success' :
                                    period.paymentProgress > 50 ? 'bg-primary' : 'bg-warning'
                                  }`}
                                  style={{ width: `${Math.min(100, period.paymentProgress)}%` }}
                                />
                              </div>
                            </div>

                            {/* Payment Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                <p className="text-xs text-foreground-500">Package Price</p>
                                <p className="text-base font-bold text-primary">₹{period.packagePrice?.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
                                <p className="text-xs text-foreground-500">Paid</p>
                                <p className="text-base font-bold text-success">₹{period.paidAmount?.toLocaleString()}</p>
                              </div>
                              <div className={`text-center p-2 rounded-lg ${
                                period.remainingAmount > 0 ?
                                'bg-warning-50 dark:bg-warning-900/20' :
                                'bg-success-50 dark:bg-success-900/20'
                              }`}>
                                <p className="text-xs text-foreground-500">Remaining</p>
                                <p className={`text-base font-bold ${
                                  period.remainingAmount > 0 ? 'text-warning' : 'text-success'
                                }`}>₹{period.remainingAmount?.toLocaleString()}</p>
                              </div>
                            </div>

                            {/* Individual payments in this period */}
                            {period.payments && period.payments.length > 0 && (
                              <div className="space-y-2 pt-3 border-t border-divider">
                                <p className="text-xs font-semibold text-foreground-500 uppercase">
                                  Payments ({period.payments.length})
                                </p>
                                {period.payments.map((payment: any, paymentIndex: number) => (
                                  <div key={paymentIndex} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="text-foreground-600 font-medium">{payment.date}</span>
                                      <Chip size="sm" variant="flat" color="secondary">
                                        {payment.method}
                                      </Chip>
                                      {payment.transactionId && (
                                        <span className="text-xs text-foreground-400">#{payment.transactionId}</span>
                                      )}
                                    </div>
                                    <span className="font-bold text-foreground">₹{payment.amount?.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* No payments warning */}
                            {(!period.payments || period.payments.length === 0) && (
                              <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning/20">
                                <p className="text-sm text-warning flex items-center gap-2">
                                  <IconAlertTriangle size={16} />
                                  No payments recorded for this period
                                </p>
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Payment Status */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <IconCurrencyRupee size={20} className="text-primary" />
                    Payment Status
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-primary-50 dark:bg-primary-900/20">
                      <CardBody className="p-3 text-center">
                        <p className="text-sm text-foreground-500 mb-1">Amount Paid</p>
                        <p className="text-xl font-bold text-primary">₹{paymentBreakdown.totalPaidAmount?.toLocaleString()}</p>
                        <p className="text-xs text-foreground-400 mt-1">{paymentBreakdown.paymentStats?.completionPercentage}% complete</p>
                      </CardBody>
                    </Card>

                    <Card className={`${(paymentBreakdown.remainingAmount || 0) > 0 ? 'bg-warning-50 dark:bg-warning-900/20' : 'bg-success-50 dark:bg-success-900/20'}`}>
                      <CardBody className="p-3 text-center">
                        <p className="text-sm text-foreground-500 mb-1">Remaining</p>
                        <p className={`text-xl font-bold ${(paymentBreakdown.remainingAmount || 0) > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400'}`}>
                          ₹{paymentBreakdown.remainingAmount?.toLocaleString()}
                        </p>
                      </CardBody>
                    </Card>
                  </div>

                  {(paymentBreakdown.remainingAmount || 0) <= 0 && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success">
                      <IconCircleCheck size={20} className="text-success-600" />
                      <span className="text-success-700 dark:text-success-300 font-medium">Fully Paid</span>
                    </div>
                  )}
                </div>

              </>
            )}
        </div>
      </BottomSheet>

      {/* Delete Payment Confirmation Modal */}
      <BottomSheet
        isOpen={isDeleteConfirmOpen}
        onClose={onDeleteConfirmClose}
        title="Delete Payment"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onPress={onDeleteConfirmClose} className="flex-1">
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() => {
                confirmAction();
                onDeleteConfirmClose();
              }}
              className="flex-1"
            >
              Delete Payment
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <IconTrash size={48} className="text-danger mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Payment Record</h3>
            <p className="text-foreground-500 mb-4">
              Are you sure you want to delete this payment of{' '}
              <span className="font-bold text-primary">₹{confirmData?.amount?.toLocaleString()}</span>?
            </p>
            <div className="p-4 bg-danger/10 rounded-lg border border-danger/20">
              <p className="text-sm text-danger">
                ⚠️ This action cannot be undone and will affect the user's payment records.
              </p>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Clear User Payments Confirmation Modal */}
      <BottomSheet
        isOpen={isClearUserConfirmOpen}
        onClose={onClearUserConfirmClose}
        title="Clear All Payments"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onPress={onClearUserConfirmClose} className="flex-1">
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() => {
                confirmAction();
                onClearUserConfirmClose();
              }}
              className="flex-1"
            >
              Clear All Payments
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <IconTrash size={48} className="text-danger mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Clear All Payment Records</h3>
            <p className="text-foreground-500 mb-4">
              Delete all payment records for{' '}
              <span className="font-bold text-primary">{confirmData?.user?.userName}</span>?
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm text-warning font-medium mb-2">This will permanently delete:</p>
                <ul className="text-sm text-warning space-y-1">
                  <li>• All payment history for this user</li>
                  <li>• Reset payment totals to zero</li>
                </ul>
              </div>
              <div className="p-4 bg-danger/10 rounded-lg border border-danger/20">
                <p className="text-sm text-danger font-medium">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Clear All Records Confirmation Modal */}
      <BottomSheet
        isOpen={isClearAllConfirmOpen}
        onClose={onClearAllConfirmClose}
        title="DANGER: Clear All Records"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onPress={onClearAllConfirmClose} className="flex-1">
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() => {
                confirmAction();
                onClearAllConfirmClose();
              }}
              className="flex-1"
            >
              Clear All Records
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <IconTrash size={48} className="text-danger mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-danger mb-2">DANGER ZONE</h3>
            <p className="text-foreground-500 mb-4">
              This will permanently delete ALL payment data for ALL users!
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-danger/10 rounded-lg border border-danger/20">
                <p className="text-sm text-danger font-medium mb-2">This will permanently delete:</p>
                <ul className="text-sm text-danger space-y-1">
                  <li>• All payment history for all users</li>
                  <li>• All pricing information</li>
                  <li>• All payment-related data</li>
                </ul>
              </div>
              <div className="p-4 bg-danger/20 rounded-lg border border-danger">
                <p className="text-sm text-danger font-bold">
                  ⚠️ THIS ACTION CANNOT BE UNDONE!
                </p>
                <p className="text-xs text-danger mt-1">
                  Please ensure you have backups before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Warning Modal */}
      <BottomSheet
        isOpen={isWarningOpen}
        onClose={onWarningClose}
        title={warningData?.title || "Warning"}
        footer={
          <div className="flex gap-2 w-full">
            <Button color="primary" onPress={onWarningClose} className="flex-1">
              Got it
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            {warningData?.icon === 'membership' ? (
              <IconUser size={48} className="text-warning mx-auto mb-4" />
            ) : (
              <IconAlertCircle size={48} className="text-warning mx-auto mb-4" />
            )}
            <h3 className="text-lg font-semibold text-foreground mb-2">{warningData?.title}</h3>
            <p className="text-foreground-500 mb-4">{warningData?.message}</p>
            {warningData?.submessage && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  💡 {warningData.submessage}
                </p>
              </div>
            )}
            {warningData?.type === 'noMembership' && (
              <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm text-warning">
                  <strong>How to fix:</strong> Navigate to Admin → Users → Select User → Progress page and set up the gym membership details including start date, duration, and membership status.
                </p>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Monthly Details Modal */}
      <BottomSheet
        isOpen={isMonthlyDetailOpen}
        onClose={onMonthlyDetailClose}
        title={selectedMonth ? `${selectedMonth.month} ${selectedMonth.year} - Financial Analysis` : "Monthly Details"}
        size="full"
      >
        {selectedMonth && (
          <div className="space-y-6">
            {/* Professional Financial Dashboard */}
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-lg border border-success/20">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-success-600 dark:text-success-400 mb-1">Cash In Hand</p>
                        <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                          {formatCurrency(selectedMonth.totalIncome)}
                        </p>
                        <p className="text-xs text-success-500 mt-1">
                          From {selectedMonth.totalClients} clients
                        </p>
                      </div>
                      <div className="p-3 bg-success/10 rounded-lg">
                        <IconTrendingUp size={24} className="text-success" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-lg border border-primary/20">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-primary-600 dark:text-primary-400 mb-1">Available Budget</p>
                        <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                          {formatCurrency(selectedMonth.totalAvailableForSpending || 0)}
                        </p>
                        <p className="text-xs text-primary-500 mt-1">
                          Safe to spend
                        </p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <IconCalculator size={24} className="text-primary" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-lg border border-danger/20">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-danger-600 dark:text-danger-400 mb-1">Total Expenses</p>
                        <p className="text-2xl font-bold text-danger-700 dark:text-danger-300">
                          {formatCurrency(selectedExpenses?.totalExpenses || 0)}
                        </p>
                        <p className="text-xs text-danger-500 mt-1">
                          {selectedExpenses?.customExpenses.length || 0} items
                        </p>
                      </div>
                      <div className="p-3 bg-danger/10 rounded-lg">
                        <IconReceiptTax size={24} className="text-danger" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className={`shadow-lg border ${
                  ((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0
                    ? 'border-success/20' : 'border-warning/20'
                }`}>
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-foreground-500 mb-1">Net Balance</p>
                        <p className={`text-2xl font-bold ${
                          ((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0
                            ? 'text-success-700 dark:text-success-300'
                            : 'text-warning-700 dark:text-warning-300'
                        }`}>
                          {formatCurrency((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0))}
                        </p>
                        <p className="text-xs text-foreground-500 mt-1">
                          {((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0 ? 'On Budget' : 'Over Budget'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        ((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0
                          ? 'bg-success/10' : 'bg-warning/10'
                      }`}>
                        <IconChartBar size={24} className={
                          ((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0
                            ? 'text-success' : 'text-warning'
                        } />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Cash Flow Scenarios Analysis */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconReportAnalytics size={20} className="text-primary" />
                    <h4 className="font-semibold text-foreground">Cash Flow Scenarios Analysis</h4>
                    <Chip color="primary" variant="flat" size="sm">Live Data</Chip>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      // Calculate real scenario data based on actual membership dates and payment patterns
                      const totalRevenue = selectedMonth.totalIncome;
                      const totalExpenses = selectedExpenses?.totalExpenses || 0;
                      const budgetUsage = selectedMonth.totalAvailableForSpending > 0 ?
                        (totalExpenses / selectedMonth.totalAvailableForSpending) * 100 : 0;

                      // Real calculation functions
                      const calculateRealScenarios = () => {
                        const currentDate = nowIST();
                        const selectedMonthDate = new Date(selectedMonth.year, new Date(`${selectedMonth.month} 1, ${selectedMonth.year}`).getMonth(), 1);
                        const monthStart = new Date(selectedMonth.year, selectedMonthDate.getMonth(), 1);
                        const monthEnd = new Date(selectedMonth.year, selectedMonthDate.getMonth() + 1, 0);

                        let onTimePayments = 0;
                        let latePayments = 0;
                        let prepaidPayments = 0;
                        let cancelledRefunds = 0;
                        let partialPayments = 0;

                        let onTimeUsers = 0;
                        let lateUsers = 0;
                        let prepaidUsers = 0;
                        let cancelledUsers = 0;

                        // Analyze each user's payment patterns for this month
                        selectedMonth.users.forEach((user: any) => {
                          const paymentBreakdown = user.paymentBreakdown;
                          if (!paymentBreakdown) return;

                          const allocatedAmount = paymentBreakdown.allocatedAmount || 0;
                          const paidAmount = paymentBreakdown.paidAmount || 0;
                          const monthlyPayments = user.monthlyPayments || [];

                          // Determine payment timing and status
                          if (user.membershipStatus === 'CANCELLED' || user.membershipStatus === 'EXPIRED') {
                            cancelledRefunds += Math.max(0, paidAmount - allocatedAmount); // Refund excess
                            if (paidAmount > 0) cancelledUsers++;
                            return;
                          }

                          if (monthlyPayments.length === 0 && allocatedAmount > 0) {
                            // No payment but amount was due
                            return;
                          }

                          // Check payment timing
                          monthlyPayments.forEach((payment: any) => {
                            const paymentDate = new Date(payment.paymentDate);
                            const dueDate = new Date(monthStart);
                            dueDate.setDate(15); // Assume payments are due by 15th of each month

                            if (paymentDate <= dueDate) {
                              // On-time payment
                              onTimePayments += payment.amount;
                              onTimeUsers++;

                              // Check if prepaid (paid more than allocated for this month)
                              if (paidAmount > allocatedAmount) {
                                prepaidPayments += (paidAmount - allocatedAmount);
                                prepaidUsers++;
                              }
                            } else {
                              // Late payment
                              latePayments += payment.amount;
                              lateUsers++;
                            }
                          });

                          // Check for partial payments
                          if (paidAmount > 0 && paidAmount < allocatedAmount) {
                            partialPayments += (allocatedAmount - paidAmount);
                          }
                        });

                        // Calculate scenario amounts
                        const totalOnTimeAmount = onTimePayments;
                        const totalLateAmount = latePayments;
                        const totalPrepaidAmount = prepaidPayments;
                        const totalCancelledAmount = cancelledRefunds;

                        return {
                          onTime: {
                            amount: totalOnTimeAmount,
                            users: onTimeUsers,
                            status: onTimeUsers >= selectedMonth.totalClients * 0.9 ? "Excellent" : "Good"
                          },
                          late: {
                            amount: totalLateAmount,
                            users: lateUsers,
                            status: lateUsers > selectedMonth.totalClients * 0.2 ? "Concerning" : "Manageable"
                          },
                          prepaid: {
                            amount: totalPrepaidAmount,
                            users: prepaidUsers,
                            status: totalPrepaidAmount > 0 ? "Cash Flow Positive" : "Standard"
                          },
                          cancelled: {
                            amount: totalCancelledAmount,
                            users: cancelledUsers,
                            status: totalCancelledAmount > totalRevenue * 0.1 ? "High Impact" : "Normal"
                          }
                        };
                      };

                      const realData = calculateRealScenarios();

                      const scenarios = [
                        {
                          title: "On-Time Payments",
                          description: "Payments received by due date",
                          icon: <IconCircleCheck size={20} className="text-success" />,
                          color: "success",
                          amount: realData.onTime.amount,
                          status: realData.onTime.status,
                          details: `₹${realData.onTime.amount.toLocaleString()} from ${realData.onTime.users} clients on time`
                        },
                        {
                          title: "Late Payments",
                          description: "Payments received after due date",
                          icon: <IconClock size={20} className="text-warning" />,
                          color: "warning",
                          amount: realData.late.amount,
                          status: realData.late.status,
                          details: realData.late.users > 0 ? `₹${realData.late.amount.toLocaleString()} from ${realData.late.users} late payers` : "No late payments this month"
                        },
                        {
                          title: "Advance Payments",
                          description: "Prepaid amounts for future periods",
                          icon: <IconCalendarEvent size={20} className="text-primary" />,
                          color: "primary",
                          amount: realData.prepaid.amount,
                          status: realData.prepaid.status,
                          details: realData.prepaid.users > 0 ? `₹${realData.prepaid.amount.toLocaleString()} prepaid by ${realData.prepaid.users} clients` : "No advance payments"
                        },
                        {
                          title: "Refunds/Adjustments",
                          description: "Cancelled memberships & refunds",
                          icon: <IconReceiptTax size={20} className="text-danger" />,
                          color: "danger",
                          amount: realData.cancelled.amount,
                          status: realData.cancelled.status,
                          details: realData.cancelled.users > 0 ? `₹${realData.cancelled.amount.toLocaleString()} refunded to ${realData.cancelled.users} clients` : "No refunds required"
                        }
                      ];

                      return scenarios.map((scenario, index) => (
                        <Card key={index} className={`border border-${scenario.color}/20`}>
                          <CardBody className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-${scenario.color}/10`}>
                                {scenario.icon}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-sm mb-1">{scenario.title}</h5>
                                <p className="text-xs text-foreground-500 mb-2">{scenario.description}</p>
                                <p className={`text-lg font-bold text-${scenario.color} mb-1`}>
                                  {formatCurrency(scenario.amount)}
                                </p>
                                <Chip size="sm" color={scenario.color as "success" | "warning" | "primary" | "danger"} variant="flat">
                                  {scenario.status}
                                </Chip>
                                <p className="text-xs text-foreground-400 mt-2">{scenario.details}</p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ));
                    })()}
                  </div>
                </CardBody>
              </Card>

              {/* Monthly Cash Flow Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconChartAreaFilled size={20} className="text-primary" />
                    <h4 className="font-semibold text-foreground">Cash Flow Visualization</h4>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="h-64">
                    {(() => {
                      const chartData = [
                        { name: 'Opening Balance', amount: 0, type: 'balance' },
                        { name: 'Revenue In', amount: selectedMonth.totalIncome, type: 'income' },
                        { name: 'Expenses Out', amount: -(selectedExpenses?.totalExpenses || 0), type: 'expense' },
                        { name: 'Closing Balance', amount: (selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0), type: 'balance' },
                      ];

                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <ChartTooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const value = payload[0].value as number;
                                  return (
                                    <div className="bg-content1 border border-divider rounded-lg p-3 shadow-lg">
                                      <p className="font-medium mb-1">{label}</p>
                                      <p className={`text-sm ${value >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(Math.abs(value))} {value < 0 ? '(Outflow)' : '(Inflow)'}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="amount"
                              stroke="#3b82f6"
                              fill="url(#flowGradient)"
                              name="Cash Flow"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Custom Tabs Implementation */}
            <div className="flex border-b border-divider bg-content1 rounded-t-lg">
              <button
                onClick={() => setMonthlyCurrentTab("users")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 hover:text-primary ${
                  monthlyCurrentTab === "users"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
              >
                <IconUsers size={18} />
                <span className="font-medium">All Users & Budget ({selectedMonth.users?.length || 0})</span>
              </button>
              <button
                onClick={() => setMonthlyCurrentTab("revenue")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 hover:text-primary ${
                  monthlyCurrentTab === "revenue"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
              >
                <IconTrendingUp size={18} />
                <span className="font-medium">Revenue Analysis ({selectedMonth.totalClients})</span>
              </button>
              <button
                onClick={() => setMonthlyCurrentTab("expenses")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 hover:text-primary ${
                  monthlyCurrentTab === "expenses"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
              >
                <IconReceiptTax size={18} />
                <span className="font-medium">Expense Management ({selectedExpenses?.customExpenses.length || 0})</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-96 bg-content1 rounded-b-lg">
              {monthlyCurrentTab === "users" && (
                <div className="space-y-4 p-6">
                  {/* Header with Stats */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-lg">Complete User Breakdown</h4>
                      <p className="text-sm text-foreground-500">
                        Track individual client allocations and payments for {selectedMonth.month} {selectedMonth.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip color="primary" variant="flat">
                        {selectedMonth.users?.length || 0} total users
                      </Chip>
                      <Chip color="success" variant="flat">
                        {selectedMonth.users?.filter(u => u.paymentBreakdown?.paidAmount && u.paymentBreakdown.paidAmount > 0).length || 0} paid
                      </Chip>
                    </div>
                  </div>

                  {/* Search and Filter Controls */}
                  <Card className="shadow-sm">
                    <CardBody className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <Input
                            placeholder="Search by client name or email..."
                            value={monthlyUsersSearchTerm}
                            onValueChange={setMonthlyUsersSearchTerm}
                            startContent={<IconSearch size={18} className="text-foreground-400" />}
                            className="w-full"
                            size="sm"
                          />
                        </div>
                        <div className="sm:w-48">
                          <Select
                            placeholder="Filter by status"
                            selectedKeys={monthlyUsersMembershipFilter !== "all" ? [monthlyUsersMembershipFilter] : []}
                            onSelectionChange={(keys) => {
                              const selectedKey = Array.from(keys)[0] as string;
                              setMonthlyUsersMembershipFilter(selectedKey || "all");
                            }}
                            size="sm"
                            className="w-full"
                          >
                            <SelectItem key="all">All Statuses</SelectItem>
                            <SelectItem key="ACTIVE">Active</SelectItem>
                            <SelectItem key="INACTIVE">Inactive</SelectItem>
                            <SelectItem key="EXPIRED">Expired</SelectItem>
                            <SelectItem key="PAUSED">Paused</SelectItem>
                            <SelectItem key="UPCOMING">Upcoming</SelectItem>
                          </Select>
                        </div>
                        {(monthlyUsersSearchTerm || monthlyUsersMembershipFilter !== "all") && (
                          <Button
                            variant="flat"
                            color="secondary"
                            size="sm"
                            startContent={<IconX size={16} />}
                            onPress={() => {
                              setMonthlyUsersSearchTerm("");
                              setMonthlyUsersMembershipFilter("all");
                              setMonthlyUsersPage(1);
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>

                  {/* Users Table */}
                  <Card className="shadow-sm">
                    <CardBody className="p-0">
                      {(() => {
                        // Filter and paginate users
                        const filteredUsers = selectedMonth.users?.filter(user => {
                          const matchesSearch = monthlyUsersSearchTerm === "" ||
                            user.userName.toLowerCase().includes(monthlyUsersSearchTerm.toLowerCase()) ||
                            user.userEmail.toLowerCase().includes(monthlyUsersSearchTerm.toLowerCase());
                          const matchesStatus = monthlyUsersMembershipFilter === "all" ||
                            user.membershipStatus === monthlyUsersMembershipFilter;
                          return matchesSearch && matchesStatus;
                        }) || [];

                        const totalFilteredUsers = filteredUsers.length;
                        const startIndex = (monthlyUsersPage - 1) * monthlyUsersItemsPerPage;
                        const endIndex = startIndex + monthlyUsersItemsPerPage;
                        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

                        if (filteredUsers.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <IconUsers size={48} className="text-foreground-300 mx-auto mb-4" />
                              <h4 className="text-lg font-medium mb-2">
                                {monthlyUsersSearchTerm || monthlyUsersMembershipFilter !== "all"
                                  ? "No Matching Users"
                                  : "No User Data"
                                }
                              </h4>
                              <p className="text-foreground-500">
                                {monthlyUsersSearchTerm || monthlyUsersMembershipFilter !== "all"
                                  ? "Try adjusting your search or filter criteria."
                                  : "No user payment data available for this month."
                                }
                              </p>
                            </div>
                          );
                        }

                        return (
                          <>
                            <Table aria-label="Users budget breakdown table" className="min-h-[400px]">
                              <TableHeader>
                                <TableColumn className="w-[200px]">CLIENT</TableColumn>
                                <TableColumn className="w-[120px]">MEMBERSHIP STATUS</TableColumn>
                                <TableColumn className="w-[130px]">ALLOCATED FOR MONTH</TableColumn>
                                <TableColumn className="w-[120px]">AMOUNT PAID</TableColumn>
                                <TableColumn className="w-[120px]">MONTHLY SPENDING</TableColumn>
                                <TableColumn className="w-[120px]">AVAILABLE</TableColumn>
                                <TableColumn className="w-[100px]">COVERAGE</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {paginatedUsers.map((user, index) => {
                                  const allocatedAmount = user.paymentBreakdown?.allocatedAmount || 0;
                                  const paidAmount = user.paymentBreakdown?.paidAmount || 0;
                                  const availableAmount = user.paymentBreakdown?.availableForSpending || 0;
                                  const coveragePercentage = allocatedAmount > 0 ? (paidAmount / allocatedAmount) * 100 : 0;

                                  // Calculate real monthly spending based on actual membership usage
                                  // This represents the actual amount allocated to the gym for their services this month
                                  const monthlySpending = Math.min(allocatedAmount, paidAmount); // Real allocated spending amount
                                  const spendingPercentage = allocatedAmount > 0 ? (monthlySpending / allocatedAmount) * 100 : 0;

                                  return (
                                    <TableRow key={user.id}>
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                            {startIndex + index + 1}
                                          </div>
                                          <Avatar src={user.userImageUrl} name={user.userName} size="sm" />
                                          <div>
                                            <p className="font-medium text-sm">{user.userName}</p>
                                            <p className="text-xs text-foreground-500">{user.userEmail}</p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          size="sm"
                                          color={
                                            user.membershipStatus === 'ACTIVE' ? 'success' :
                                            user.membershipStatus === 'EXPIRED' ? 'danger' :
                                            user.membershipStatus === 'PAUSED' ? 'warning' :
                                            user.membershipStatus === 'UPCOMING' ? 'secondary' : 'default'
                                          }
                                          variant="flat"
                                        >
                                          {user.membershipStatus}
                                        </Chip>
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <span className="font-semibold text-sm">
                                            {formatCurrency(allocatedAmount)}
                                          </span>
                                          {allocatedAmount > 0 && (
                                            <p className="text-xs text-foreground-400">
                                              Monthly allocation
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <span className="font-semibold text-success text-sm">
                                            {formatCurrency(paidAmount)}
                                          </span>
                                          {paidAmount > 0 && (
                                            <p className="text-xs text-success-500">
                                              Payments received
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <span className="font-semibold text-warning text-sm">
                                            {formatCurrency(monthlySpending)}
                                          </span>
                                          {monthlySpending > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                              <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                  className="h-full bg-warning rounded-full transition-all"
                                                  style={{ width: `${Math.min(100, spendingPercentage)}%` }}
                                                />
                                              </div>
                                              <span className="text-xs text-warning-600">
                                                {spendingPercentage.toFixed(0)}%
                                              </span>
                                            </div>
                                          )}
                                          {monthlySpending === 0 && (
                                            <p className="text-xs text-foreground-400">
                                              No spending
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <span className="font-semibold text-primary text-sm">
                                            {formatCurrency(availableAmount)}
                                          </span>
                                          {availableAmount > 0 && (
                                            <p className="text-xs text-primary-500">
                                              Safe to spend
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all ${
                                                coveragePercentage >= 100 ? 'bg-success' :
                                                coveragePercentage >= 50 ? 'bg-warning' : 'bg-danger'
                                              }`}
                                              style={{ width: `${Math.min(100, coveragePercentage)}%` }}
                                            />
                                          </div>
                                          <span className="text-xs font-medium text-foreground-600">
                                            {coveragePercentage.toFixed(0)}%
                                          </span>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>

                            {/* Results Summary */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-divider bg-content2">
                              <div className="text-sm text-foreground-500">
                                Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredUsers)} of {totalFilteredUsers} users
                                {monthlyUsersSearchTerm || monthlyUsersMembershipFilter !== "all" ? " (filtered)" : ""}
                              </div>
                              <div className="text-sm font-medium text-foreground">
                                Total Allocated: {formatCurrency(filteredUsers.reduce((sum, user) => sum + (user.paymentBreakdown?.allocatedAmount || 0), 0))} |{" "}
                                Total Paid: {formatCurrency(filteredUsers.reduce((sum, user) => sum + (user.paymentBreakdown?.paidAmount || 0), 0))} |{" "}
                                Total Spending: {formatCurrency(filteredUsers.reduce((sum, user) => {
                                  const allocated = user.paymentBreakdown?.allocatedAmount || 0;
                                  const paid = user.paymentBreakdown?.paidAmount || 0;
                                  return sum + (Math.min(allocated, paid) * 0.85);
                                }, 0))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </CardBody>
                  </Card>

                  {/* Pagination */}
                  {selectedMonth.users && selectedMonth.users.length > 0 && (
                    <div className="flex justify-center">
                      <div className="pagination-wrapper">
                        <Pagination
                          showControls
                          total={Math.max(1, Math.ceil(
                            (selectedMonth.users?.filter(user => {
                              const matchesSearch = monthlyUsersSearchTerm === "" ||
                                user.userName.toLowerCase().includes(monthlyUsersSearchTerm.toLowerCase()) ||
                                user.userEmail.toLowerCase().includes(monthlyUsersSearchTerm.toLowerCase());
                              const matchesStatus = monthlyUsersMembershipFilter === "all" ||
                                user.membershipStatus === monthlyUsersMembershipFilter;
                              return matchesSearch && matchesStatus;
                            }).length || 0) / monthlyUsersItemsPerPage
                          ))}
                          page={monthlyUsersPage}
                          onChange={(page) => setMonthlyUsersPage(page)}
                          size="sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {monthlyCurrentTab === "revenue" && (
                <div className="space-y-4 p-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Revenue Analysis</h4>
                    <Chip color="success" variant="flat">
                      {selectedMonth.totalClients} paying clients
                    </Chip>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-success/10">
                      <CardBody className="p-4 text-center">
                        <p className="text-sm text-success font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-success">{formatCurrency(selectedMonth.totalIncome)}</p>
                      </CardBody>
                    </Card>
                    <Card className="bg-primary/10">
                      <CardBody className="p-4 text-center">
                        <p className="text-sm text-primary font-medium">Average Payment</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(selectedMonth.averagePayment || 0)}</p>
                      </CardBody>
                    </Card>
                    <Card className="bg-secondary/10">
                      <CardBody className="p-4 text-center">
                        <p className="text-sm text-secondary font-medium">Paying Clients</p>
                        <p className="text-2xl font-bold text-secondary">{selectedMonth.totalClients}</p>
                      </CardBody>
                    </Card>
                  </div>

                  {selectedMonth.payments && selectedMonth.payments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <h5 className="font-semibold">Payment Breakdown</h5>
                      </CardHeader>
                      <CardBody>
                        <Table aria-label="Payments table">
                          <TableHeader>
                            <TableColumn>CLIENT</TableColumn>
                            <TableColumn>AMOUNT</TableColumn>
                            <TableColumn>METHOD</TableColumn>
                            <TableColumn>DATE</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {selectedMonth.payments.slice(0, 10).map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar src={payment.userImageUrl} name={payment.userName} size="sm" />
                                    <div>
                                      <p className="font-medium">{payment.userName}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-success">{formatCurrency(payment.amount)}</span>
                                </TableCell>
                                <TableCell>
                                  <Chip size="sm" variant="flat">{payment.paymentMethod}</Chip>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{formatIST(new Date(payment.paymentDate))}</span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardBody>
                    </Card>
                  )}
                </div>
              )}

              {monthlyCurrentTab === "expenses" && (
                <div className="space-y-4 p-6">
                  {/* Header with Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-lg">Expense Management</h4>
                      <p className="text-sm text-foreground-500">
                        {selectedExpenses?.customExpenses.length || 0} expenses • Total: {formatCurrency(selectedExpenses?.totalExpenses || 0)}
                      </p>
                    </div>
                    <Button
                      color="primary"
                      startContent={<IconPlus size={16} />}
                      onPress={openAddExpenseModal}
                    >
                      Add Expense
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      placeholder="Search expenses..."
                      startContent={<IconSearch size={16} className="text-foreground-400" />}
                      value={expenseSearchTerm}
                      onChange={(e) => setExpenseSearchTerm(e.target.value)}
                      className="sm:max-w-xs"
                    />
                    <Select
                      placeholder="Filter by category"
                      value={expenseCategoryFilter}
                      onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                      className="sm:max-w-xs"
                      startContent={<IconFilter size={16} />}
                    >
                      {["all", ...expenseCategories].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Expense Table */}
                  {selectedExpenses && selectedExpenses.customExpenses.length > 0 ? (
                    <>
                      <Card className="bg-content1">
                        <CardBody className="p-0">
                          <Table
                            aria-label="Expenses table"
                            className="min-h-[400px]"
                            removeWrapper
                          >
                            <TableHeader>
                              <TableColumn>EXPENSE DETAILS</TableColumn>
                              <TableColumn>CATEGORY</TableColumn>
                              <TableColumn>AMOUNT</TableColumn>
                              <TableColumn>DATE</TableColumn>
                              <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                              {selectedExpenses.customExpenses
                                .filter(expense => {
                                  const matchesSearch = expenseSearchTerm === "" ||
                                    expense.description.toLowerCase().includes(expenseSearchTerm.toLowerCase()) ||
                                    expense.notes?.toLowerCase().includes(expenseSearchTerm.toLowerCase());
                                  const matchesCategory = expenseCategoryFilter === "all" || expense.category === expenseCategoryFilter;
                                  return matchesSearch && matchesCategory;
                                })
                                .slice((expensePage - 1) * expenseItemsPerPage, expensePage * expenseItemsPerPage)
                                .map((expense) => (
                                <TableRow key={expense.id} className="hover:bg-content2">
                                  <TableCell>
                                    <div className="max-w-xs">
                                      <p className="font-semibold text-foreground">{expense.description}</p>
                                      {expense.notes && (
                                        <p className="text-sm text-foreground-500 mt-1 line-clamp-2">{expense.notes}</p>
                                      )}
                                      {expense.recordedByName && (
                                        <p className="text-xs text-foreground-400 mt-1">by {expense.recordedByName}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      color="primary"
                                      className="max-w-[120px]"
                                    >
                                      {expense.category}
                                    </Chip>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-bold text-danger text-lg">
                                      {formatCurrency(expense.amount)}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <p className="font-medium">
                                        {formatIST(new Date(expense.date), true, {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </p>
                                      <p className="text-foreground-500">
                                        {formatIST(new Date(expense.date), true, { weekday: 'short' })}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="primary"
                                        onPress={() => openEditExpenseModal(expense)}
                                      >
                                        <IconEdit size={16} />
                                      </Button>
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => deleteExpense(expense.id)}
                                      >
                                        <IconTrash size={16} />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardBody>
                      </Card>

                      {/* Pagination */}
                      {selectedExpenses.customExpenses.filter(expense => {
                        const matchesSearch = expenseSearchTerm === "" ||
                          expense.description.toLowerCase().includes(expenseSearchTerm.toLowerCase()) ||
                          expense.notes?.toLowerCase().includes(expenseSearchTerm.toLowerCase());
                        const matchesCategory = expenseCategoryFilter === "all" || expense.category === expenseCategoryFilter;
                        return matchesSearch && matchesCategory;
                      }).length > expenseItemsPerPage && (
                        <div className="flex justify-center">
                          <Pagination
                            total={Math.ceil(selectedExpenses.customExpenses.filter(expense => {
                              const matchesSearch = expenseSearchTerm === "" ||
                                expense.description.toLowerCase().includes(expenseSearchTerm.toLowerCase()) ||
                                expense.notes?.toLowerCase().includes(expenseSearchTerm.toLowerCase());
                              const matchesCategory = expenseCategoryFilter === "all" || expense.category === expenseCategoryFilter;
                              return matchesSearch && matchesCategory;
                            }).length / expenseItemsPerPage)}
                            page={expensePage}
                            onChange={setExpensePage}
                            showControls
                            showShadow
                            color="primary"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Card className="bg-content1">
                        <CardBody className="p-8">
                          <IconReceiptTax size={64} className="text-foreground-300 mx-auto mb-4" />
                          <h4 className="text-xl font-semibold mb-2">No Expenses Recorded</h4>
                          <p className="text-foreground-500 mb-6">
                            Start tracking your monthly expenses to get better financial insights and budget management.
                          </p>
                          <Button
                            color="primary"
                            size="lg"
                            startContent={<IconPlus size={20} />}
                            onPress={openAddExpenseModal}
                          >
                            Add Your First Expense
                          </Button>
                        </CardBody>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Add/Edit Expense Modal */}
      <BottomSheet
        isOpen={isAddExpenseOpen}
        onClose={onAddExpenseClose}
        title={editingExpense ? "Edit Expense" : "Add New Expense"}
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onPress={onAddExpenseClose} className="flex-1">
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={saveExpense}
              isLoading={savingExpense}
              className="flex-1"
            >
              {editingExpense ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              placeholder="Select category"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
            >
              {expenseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </Select>

            <Input
              type="number"
              label="Amount (₹)"
              placeholder="Enter amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
            />
          </div>

          <Input
            label="Description"
            placeholder="Enter expense description"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
          />

          <DatePicker
            label="Expense Date"
            value={new Date(expenseForm.date)}
            onChange={(date) => setExpenseForm({...expenseForm, date: date?.toISOString().split('T')[0] || ''})}
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Additional notes about this expense"
            value={expenseForm.notes}
            onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
            maxRows={3}
          />
        </div>
      </BottomSheet>
    </div>
  );
}