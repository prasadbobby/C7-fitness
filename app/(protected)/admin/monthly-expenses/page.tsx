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
  Chip,
  Avatar,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Tooltip,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import {
  IconCalendar,
  IconCurrencyRupee,
  IconUsers,
  IconTrendingUp,
  IconTrendingDown,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalculator,
  IconFileText,
  IconPrinter,
  IconDownload,
  IconEye,
  IconCash,
  IconDeviceDesktop,
  IconCreditCardPay,
  IconBrandPaypal,
  IconBuildingBank,
  IconCreditCard,
  IconFilter,
  IconSearch,
  IconDotsVertical,
  IconCalendarDue,
  IconReportAnalytics,
  IconChartPie,
  IconReceiptTax,
  IconAlertTriangle,
  IconAlertCircle,
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";
import SuperAdminAuthModal from "@/components/SuperAdminAuthModal";
import DatePicker from "@/components/UI/DatePicker";
import { toast } from "sonner";

interface PaymentData {
  id: string;
  userName: string;
  userEmail: string;
  userImageUrl: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string | null;
  notes: string | null;
  recordedByName: string;
}

interface UserData {
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
  monthlyPayments: PaymentData[];
}

interface MonthlyData {
  month: string;
  year: number;
  totalIncome: number;
  totalClients: number;
  averagePayment: number;
  payments: PaymentData[];
  users: UserData[];
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
  { key: "CASH", label: "Cash", icon: IconCash },
  { key: "ONLINE", label: "Online", icon: IconDeviceDesktop },
  { key: "CARD", label: "Card", icon: IconCreditCardPay },
  { key: "UPI", label: "UPI", icon: IconBrandPaypal },
  { key: "BANK_TRANSFER", label: "Bank Transfer", icon: IconBuildingBank },
  { key: "CHEQUE", label: "Cheque", icon: IconFileText },
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

export default function MonthlyExpensesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyData | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<MonthlyExpenses | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [currentTab, setCurrentTab] = useState('users');

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);

  // Pagination for payments table
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const itemsPerPage = 10;

  // Modals
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isExpenseOpen, onOpen: onExpenseOpen, onClose: onExpenseClose } = useDisclosure();
  const { isOpen: isAuthOpen, onOpen: onAuthOpen, onClose: onAuthClose } = useDisclosure();
  const { isOpen: isAddExpenseOpen, onOpen: onAddExpenseOpen, onClose: onAddExpenseClose } = useDisclosure();

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    if (showAuthModal) {
      onAuthOpen();
    }
  }, [showAuthModal, onAuthOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMonthlyData();
    }
  }, [currentDate, isAuthenticated]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const response = await fetch(`/api/admin/monthly-expenses?year=${year}`);

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
      setLoading(false);
    }
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

  const getMonthName = (monthIndex: number) => {
    return new Date(2024, monthIndex, 1).toLocaleDateString('en-IN', { month: 'long' });
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodData = paymentMethods.find(m => m.key === method);
    return methodData ? methodData.icon : IconCreditCard;
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const openMonthDetails = (monthData: MonthlyData) => {
    setSelectedMonth(monthData);
    setCurrentPage(1);
    setSearchTerm("");
    setMethodFilter("all");

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
    onDetailOpen();
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: "",
      description: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
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
      const response = await fetch(`/api/admin/monthly-expenses/expense`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expenseId,
          month: selectedMonth.month,
          year: selectedMonth.year
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Expense deleted successfully');

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
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error deleting expense');
    }
  };

  // Filter and paginate payments
  const filteredPayments = selectedMonth ? selectedMonth.payments.filter(payment => {
    const matchesSearch = payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  }) : [];

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Calculate current year summary
  const yearSummary = monthlyData.reduce(
    (acc, month) => {
      acc.totalIncome += month.totalIncome;
      acc.totalClients += month.totalClients;
      return acc;
    },
    { totalIncome: 0, totalClients: 0 }
  );

  const yearExpenses = monthlyExpenses.reduce(
    (acc, month) => acc + month.totalExpenses,
    0
  );

  const yearBalance = yearSummary.totalIncome - yearExpenses;

  // Show authentication modal if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="space-y-6">
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <IconCurrencyRupee size={64} className="mx-auto text-foreground-300 mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Monthly Expenses Dashboard</h2>
              <p className="text-foreground-500">
                Please authenticate to access the monthly expenses system.
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-foreground-500 mt-2">
            Complete financial overview with income, expenses, and profitability analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-content2 rounded-lg">
            <Button
              size="sm"
              variant={viewMode === 'overview' ? 'solid' : 'light'}
              color={viewMode === 'overview' ? 'primary' : 'default'}
              onPress={() => setViewMode('overview')}
            >
              Overview
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'detailed' ? 'solid' : 'light'}
              color={viewMode === 'detailed' ? 'primary' : 'default'}
              onPress={() => setViewMode('detailed')}
            >
              Detailed
            </Button>
          </div>

          {/* Year Navigation */}
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              variant="flat"
              onPress={() => navigateYear('prev')}
            >
              <IconChevronLeft size={18} />
            </Button>
            <div className="text-xl font-bold min-w-[100px] text-center">
              {currentDate.getFullYear()}
            </div>
            <Button
              isIconOnly
              variant="flat"
              onPress={() => navigateYear('next')}
            >
              <IconChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Year Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-success-600 dark:text-success-400 mb-1">Annual Revenue</p>
                <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                  {formatCurrency(yearSummary.totalIncome)}
                </p>
                <p className="text-xs text-success-500 mt-1">{yearSummary.totalClients} total clients</p>
              </div>
              <div className="p-3 rounded-lg bg-success/20">
                <IconTrendingUp size={24} className="text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-danger-50 to-danger-100 dark:from-danger-900/20 dark:to-danger-800/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-danger-600 dark:text-danger-400 mb-1">Annual Expenses</p>
                <p className="text-2xl font-bold text-danger-700 dark:text-danger-300">
                  {formatCurrency(yearExpenses)}
                </p>
                <p className="text-xs text-danger-500 mt-1">Operating costs</p>
              </div>
              <div className="p-3 rounded-lg bg-danger/20">
                <IconTrendingDown size={24} className="text-danger" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className={`bg-gradient-to-r ${yearBalance >= 0
          ? 'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20'
          : 'from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20'}`}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${yearBalance >= 0
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-warning-600 dark:text-warning-400'}`}>
                  Net Profit
                </p>
                <p className={`text-2xl font-bold ${yearBalance >= 0
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-warning-700 dark:text-warning-300'}`}>
                  {formatCurrency(yearBalance)}
                </p>
                <p className={`text-xs mt-1 ${yearBalance >= 0
                  ? 'text-primary-500'
                  : 'text-warning-500'}`}>
                  {yearBalance >= 0 ? 'Profitable' : 'Loss'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${yearBalance >= 0 ? 'bg-primary/20' : 'bg-warning/20'}`}>
                <IconCalculator size={24} className={yearBalance >= 0 ? 'text-primary' : 'text-warning'} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Profit Margin</p>
                <p className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
                  {yearSummary.totalIncome > 0 ?
                    `${((yearBalance / yearSummary.totalIncome) * 100).toFixed(1)}%` :
                    '0%'
                  }
                </p>
                <p className="text-xs text-secondary-500 mt-1">Efficiency ratio</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/20">
                <IconChartPie size={24} className="text-secondary" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Monthly View */}
      {viewMode === 'overview' ? (
        <Card className="bg-content1">
          <CardHeader className="flex justify-between">
            <h3 className="text-lg font-semibold text-foreground">Monthly Overview - {currentDate.getFullYear()}</h3>
            <Button
              color="primary"
              startContent={<IconReportAnalytics size={16} />}
              onPress={() => setViewMode('detailed')}
            >
              Detailed View
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-foreground-500">Loading monthly data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const monthData = monthlyData.find(m => {
                    const monthDate = new Date(`${m.month} 1, ${m.year}`);
                    return monthDate.getMonth() === monthIndex && m.year === currentDate.getFullYear();
                  });

                  const monthExpenses = monthlyExpenses.find(e => {
                    const monthDate = new Date(`${e.month} 1, ${e.year}`);
                    return monthDate.getMonth() === monthIndex && e.year === currentDate.getFullYear();
                  });

                  const monthBalance = (monthData?.totalIncome || 0) - (monthExpenses?.totalExpenses || 0);

                  return (
                    <Card
                      key={monthIndex}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        monthData ? 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary/20' : 'bg-content2'
                      }`}
                      isPressable
                      onPress={() => monthData && openMonthDetails(monthData)}
                    >
                      <CardBody className="p-4">
                        <div className="text-center">
                          <h4 className="font-semibold text-lg mb-3">{getMonthName(monthIndex)}</h4>

                          {monthData ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground-500">Revenue:</span>
                                <span className="font-semibold text-success">{formatCurrency(monthData.totalIncome)}</span>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground-500">Available Budget:</span>
                                <span className="font-semibold text-primary">
                                  {formatCurrency(monthData.totalAvailableForSpending || 0)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground-500">Expenses:</span>
                                <span className="font-semibold text-danger">
                                  {formatCurrency(monthExpenses?.totalExpenses || 0)}
                                </span>
                              </div>

                              <div className="border-t border-divider pt-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-foreground-500">Budget Balance:</span>
                                  <span className={`font-bold ${
                                    ((monthData.totalAvailableForSpending || 0) - (monthExpenses?.totalExpenses || 0)) >= 0
                                      ? 'text-success' : 'text-warning'
                                  }`}>
                                    {formatCurrency((monthData.totalAvailableForSpending || 0) - (monthExpenses?.totalExpenses || 0))}
                                  </span>
                                </div>
                                {((monthData.totalAvailableForSpending || 0) - (monthExpenses?.totalExpenses || 0)) < 0 && (
                                  <p className="text-xs text-warning mt-1">Over Budget!</p>
                                )}
                              </div>

                              <div className="flex items-center justify-center gap-1 mt-3">
                                <IconUsers size={14} className="text-foreground-400" />
                                <span className="text-xs text-foreground-500">{monthData.totalClients} clients</span>
                              </div>

                              <div className="flex gap-1 mt-2">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="primary"
                                  startContent={<IconEye size={14} />}
                                  className="flex-1 text-xs"
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-foreground-400 text-sm mb-3">No data available</p>
                              <Chip size="sm" variant="flat" color="default">No activity</Chip>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        /* Detailed Table View */
        <Card className="bg-content1">
          <CardHeader className="flex justify-between">
            <h3 className="text-lg font-semibold text-foreground">Monthly Detailed Analysis - {currentDate.getFullYear()}</h3>
            <Button
              color="secondary"
              variant="flat"
              startContent={<IconChartPie size={16} />}
              onPress={() => setViewMode('overview')}
            >
              Overview
            </Button>
          </CardHeader>
          <CardBody>
            <Table aria-label="Monthly financial data">
              <TableHeader>
                <TableColumn>MONTH</TableColumn>
                <TableColumn>REVENUE</TableColumn>
                <TableColumn>EXPENSES</TableColumn>
                <TableColumn>PROFIT</TableColumn>
                <TableColumn>MARGIN</TableColumn>
                <TableColumn>CLIENTS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const monthName = getMonthName(monthIndex);
                  const monthData = monthlyData.find(m => {
                    const monthDate = new Date(`${m.month} 1, ${m.year}`);
                    return monthDate.getMonth() === monthIndex && m.year === currentDate.getFullYear();
                  });

                  const monthExpenses = monthlyExpenses.find(e => {
                    const monthDate = new Date(`${e.month} 1, ${e.year}`);
                    return monthDate.getMonth() === monthIndex && e.year === currentDate.getFullYear();
                  });

                  const revenue = monthData?.totalIncome || 0;
                  const expenses = monthExpenses?.totalExpenses || 0;
                  const profit = revenue - expenses;
                  const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

                  return (
                    <TableRow key={monthIndex}>
                      <TableCell>
                        <div className="font-semibold">{monthName}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-success">{formatCurrency(revenue)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-danger">{formatCurrency(expenses)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${profit >= 0 ? 'text-primary' : 'text-warning'}`}>
                          {formatCurrency(profit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={margin >= 20 ? 'success' : margin >= 10 ? 'warning' : 'danger'}
                          variant="flat"
                        >
                          {margin.toFixed(1)}%
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IconUsers size={14} />
                          <span>{monthData?.totalClients || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {monthData ? (
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            startContent={<IconEye size={14} />}
                            onPress={() => openMonthDetails(monthData)}
                          >
                            Details
                          </Button>
                        ) : (
                          <span className="text-foreground-400 text-sm">No data</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Month Details Modal */}
      <BottomSheet
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        title={selectedMonth ? `${selectedMonth.month} ${selectedMonth.year} - Financial Analysis` : "Month Details"}
        size="full"
      >
        {selectedMonth && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-success-50 dark:bg-success-900/20">
                <CardBody className="p-4 text-center">
                  <p className="text-sm text-success-600 dark:text-success-400 mb-1">Revenue Collected</p>
                  <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                    {formatCurrency(selectedMonth.totalIncome)}
                  </p>
                  <p className="text-xs text-success-500 mt-1">
                    {selectedMonth.totalClients} clients paid
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-primary-50 dark:bg-primary-900/20">
                <CardBody className="p-4 text-center">
                  <p className="text-sm text-primary-600 dark:text-primary-400 mb-1">Available for Spending</p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {formatCurrency(selectedMonth.totalAvailableForSpending || 0)}
                  </p>
                  <p className="text-xs text-primary-500 mt-1">
                    Budget allocation
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-danger-50 dark:bg-danger-900/20">
                <CardBody className="p-4 text-center">
                  <p className="text-sm text-danger-600 dark:text-danger-400 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-danger-700 dark:text-danger-300">
                    {formatCurrency(selectedExpenses?.totalExpenses || 0)}
                  </p>
                  <p className="text-xs text-danger-500 mt-1">
                    {selectedExpenses?.customExpenses.length || 0} expense items
                  </p>
                </CardBody>
              </Card>

              <Card className={`${
                ((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0
                  ? 'bg-success-50 dark:bg-success-900/20'
                  : 'bg-warning-50 dark:bg-warning-900/20'
              }`}>
                <CardBody className="p-4 text-center">
                  <p className="text-sm text-foreground-500 mb-1">Budget Balance</p>
                  <p className={`text-2xl font-bold ${
                    ((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0
                      ? 'text-success-700 dark:text-success-300'
                      : 'text-warning-700 dark:text-warning-300'
                  }`}>
                    {formatCurrency((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0))}
                  </p>
                  {((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) < 0 && (
                    <p className="text-xs text-warning-500 mt-1">Over Budget!</p>
                  )}
                </CardBody>
              </Card>

              <Card className="bg-secondary-50 dark:bg-secondary-900/20">
                <CardBody className="p-4 text-center">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">Budget Usage</p>
                  <p className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
                    {selectedMonth.totalAvailableForSpending > 0 ?
                      `${(((selectedExpenses?.totalExpenses || 0) / selectedMonth.totalAvailableForSpending) * 100).toFixed(1)}%` :
                      '0%'
                    }
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">
                    of available budget
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Custom Tabs Implementation */}
            <div className="flex border-b border-divider bg-content1 rounded-t-lg">
              <button
                onClick={() => setCurrentTab("users")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 hover:text-primary ${
                  currentTab === "users"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
              >
                <IconUsers size={18} />
                <span className="font-medium">All Users & Budget ({selectedMonth.users?.length || 0})</span>
              </button>
              <button
                onClick={() => setCurrentTab("revenue")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 hover:text-primary ${
                  currentTab === "revenue"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
              >
                <IconTrendingUp size={18} />
                <span className="font-medium">Revenue Analysis ({selectedMonth.totalClients})</span>
              </button>
              <button
                onClick={() => setCurrentTab("expenses")}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 hover:text-primary ${
                  currentTab === "expenses"
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
              {currentTab === "users" && (
                <div className="space-y-4 p-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Complete User Breakdown</h4>
                    <Chip color="primary" variant="flat">
                      {selectedMonth.users?.length || 0} total users
                    </Chip>
                  </div>

                  <Card>
                    <CardBody>
                      <Table aria-label="Users table">
                        <TableHeader>
                          <TableColumn>CLIENT</TableColumn>
                          <TableColumn>MEMBERSHIP STATUS</TableColumn>
                          <TableColumn>ALLOCATED FOR MONTH</TableColumn>
                          <TableColumn>AMOUNT PAID</TableColumn>
                          <TableColumn>AVAILABLE FOR SPENDING</TableColumn>
                          <TableColumn>PACKAGE INFO</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent={"No users found"}>
                          {selectedMonth.users?.map((user) => (
                            <TableRow key={user.userId}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar src={user.userImageUrl} name={user.userName} size="sm" />
                                  <div>
                                    <p className="font-medium">{user.userName}</p>
                                    <p className="text-xs text-foreground-500">{user.userEmail}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="sm"
                                  color={
                                    user.membershipStatus === 'ACTIVE' ? 'success' :
                                    user.membershipStatus === 'PAUSED' ? 'warning' :
                                    user.membershipStatus === 'EXPIRED' ? 'danger' : 'default'
                                  }
                                  variant="flat"
                                >
                                  {user.membershipStatus}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                {user.paymentBreakdown ? (
                                  <div>
                                    <span className="font-semibold text-primary">
                                      {formatCurrency(user.paymentBreakdown.allocatedAmount)}
                                    </span>
                                    <p className="text-xs text-foreground-500">
                                      {user.paymentBreakdown.daysInMonth} days
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-foreground-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {user.monthlyPayments && user.monthlyPayments.length > 0 ? (
                                  <div>
                                    <span className="font-semibold text-success">
                                      {formatCurrency(user.monthlyPayments.reduce((sum, p) => sum + p.amount, 0))}
                                    </span>
                                    <p className="text-xs text-foreground-500">
                                      {user.monthlyPayments.length} payment{user.monthlyPayments.length > 1 ? 's' : ''}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-foreground-400">₹0</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {user.paymentBreakdown ? (
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold ${
                                      user.paymentBreakdown.availableForSpending > 0 ? 'text-primary' : 'text-foreground-400'
                                    }`}>
                                      {formatCurrency(user.paymentBreakdown.availableForSpending)}
                                    </span>
                                    {user.paymentBreakdown.availableForSpending > 0 ? (
                                      <Chip size="sm" color="primary" variant="dot">
                                        Can spend
                                      </Chip>
                                    ) : (
                                      <Chip size="sm" color="danger" variant="flat">
                                        No payment
                                      </Chip>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-foreground-400">₹0</span>
                                    <Chip size="sm" color="warning" variant="flat">
                                      No membership
                                    </Chip>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {user.discountedPrice ? (
                                  <div>
                                    <p className="text-sm font-medium">₹{user.discountedPrice.toLocaleString()}</p>
                                    <p className="text-xs text-foreground-500">
                                      Paid: ₹{(user.totalAmountPaid || 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-foreground-500">
                                      Remaining: ₹{(user.remainingAmount || 0).toLocaleString()}
                                    </p>
                                  </div>
                                ) : (
                                  <Chip size="sm" variant="flat" color="warning">No pricing set</Chip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Summary */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-primary-50 dark:bg-primary-900/20">
                          <CardBody className="p-4 text-center">
                            <p className="text-sm text-primary-600 dark:text-primary-400 mb-1">Total Available Budget</p>
                            <p className="text-xl font-bold text-primary-700 dark:text-primary-300">
                              {formatCurrency(selectedMonth.totalAvailableForSpending || 0)}
                            </p>
                          </CardBody>
                        </Card>

                        <Card className="bg-danger-50 dark:bg-danger-900/20">
                          <CardBody className="p-4 text-center">
                            <p className="text-sm text-danger-600 dark:text-danger-400 mb-1">Current Expenses</p>
                            <p className="text-xl font-bold text-danger-700 dark:text-danger-300">
                              {formatCurrency(selectedExpenses?.totalExpenses || 0)}
                            </p>
                          </CardBody>
                        </Card>

                        <Card className={`${
                          ((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0
                            ? 'bg-success-50 dark:bg-success-900/20'
                            : 'bg-warning-50 dark:bg-warning-900/20'
                        }`}>
                          <CardBody className="p-4 text-center">
                            <p className="text-sm mb-1">Remaining Budget</p>
                            <p className={`text-xl font-bold ${
                              ((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) >= 0
                                ? 'text-success-700 dark:text-success-300'
                                : 'text-warning-700 dark:text-warning-300'
                            }`}>
                              {formatCurrency((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0))}
                            </p>
                            {((selectedMonth.totalAvailableForSpending || 0) - (selectedExpenses?.totalExpenses || 0)) < 0 && (
                              <Chip size="sm" color="warning" variant="flat" className="mt-1">
                                Over Budget!
                              </Chip>
                            )}
                          </CardBody>
                        </Card>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}

              {currentTab === "revenue" && (
                <div className="space-y-4 p-6">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      startContent={<IconSearch size={18} />}
                      className="w-full sm:max-w-xs"
                    />
                    <Select
                      placeholder="Filter by payment method"
                      selectedKeys={methodFilter !== "all" ? [methodFilter] : []}
                      onChange={(e) => setMethodFilter(e.target.value)}
                      className="w-full sm:max-w-xs"
                    >
                      <SelectItem key="all" value="all">All Methods</SelectItem>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.key} value={method.key}>
                          {method.label}
                        </SelectItem>
                      )) as any}
                    </Select>
                  </div>

                  {/* Payments Table */}
                  <Card>
                    <CardBody>
                      <Table
                        aria-label="Payments table"
                        bottomContent={
                          totalPages > 1 ? (
                            <div className="flex w-full justify-center">
                              <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={currentPage}
                                total={totalPages}
                                onChange={setCurrentPage}
                              />
                            </div>
                          ) : null
                        }
                      >
                        <TableHeader>
                          <TableColumn>CLIENT</TableColumn>
                          <TableColumn>AMOUNT</TableColumn>
                          <TableColumn>METHOD</TableColumn>
                          <TableColumn>DATE</TableColumn>
                          <TableColumn>TRANSACTION ID</TableColumn>
                          <TableColumn>RECORDED BY</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent={"No payments found"}>
                          {paginatedPayments.map((payment) => {
                            const MethodIcon = getPaymentMethodIcon(payment.paymentMethod);
                            return (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar src={payment.userImageUrl} name={payment.userName} size="sm" />
                                    <div>
                                      <p className="font-medium">{payment.userName}</p>
                                      <p className="text-xs text-foreground-500">{payment.userEmail}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-success">
                                    {formatCurrency(payment.amount)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <MethodIcon size={16} className="text-foreground-500" />
                                    <span className="text-sm">{payment.paymentMethod}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <IconCalendarDue size={14} className="text-foreground-400" />
                                    <span className="text-sm">
                                      {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {payment.transactionId ? (
                                    <span className="text-sm font-mono text-foreground-500">
                                      #{payment.transactionId}
                                    </span>
                                  ) : (
                                    <span className="text-foreground-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-foreground-500">
                                    {payment.recordedByName}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardBody>
                  </Card>
                </div>
              )}

              {currentTab === "expenses" && (
                <div className="space-y-4 p-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Expense Records</h4>
                    <Button
                      color="primary"
                      startContent={<IconPlus size={16} />}
                      onPress={openAddExpenseModal}
                    >
                      Add Expense
                    </Button>
                  </div>

                  {selectedExpenses && selectedExpenses.customExpenses.length > 0 ? (
                    <Card>
                      <CardBody>
                        <Table aria-label="Expenses table">
                          <TableHeader>
                            <TableColumn>CATEGORY</TableColumn>
                            <TableColumn>DESCRIPTION</TableColumn>
                            <TableColumn>AMOUNT</TableColumn>
                            <TableColumn>DATE</TableColumn>
                            <TableColumn>NOTES</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {selectedExpenses.customExpenses.map((expense) => (
                              <TableRow key={expense.id}>
                                <TableCell>
                                  <Chip size="sm" variant="flat" color="secondary">
                                    {expense.category}
                                  </Chip>
                                </TableCell>
                                <TableCell>
                                  <p className="font-medium">{expense.description}</p>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-danger">
                                    {formatCurrency(expense.amount)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {new Date(expense.date).toLocaleDateString('en-IN')}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-foreground-500">
                                    {expense.notes || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Tooltip content="Edit expense">
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="primary"
                                        onPress={() => openEditExpenseModal(expense)}
                                      >
                                        <IconEdit size={16} />
                                      </Button>
                                    </Tooltip>
                                    <Tooltip content="Delete expense">
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => deleteExpense(expense.id)}
                                      >
                                        <IconTrash size={16} />
                                      </Button>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Total Summary */}
                        <div className="mt-4 p-4 bg-content2 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Total Monthly Expenses</span>
                            <span className="text-xl font-bold text-danger">
                              {formatCurrency(selectedExpenses.totalExpenses)}
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ) : (
                    <Card>
                      <CardBody className="text-center py-8">
                        <IconReceiptTax size={48} className="mx-auto text-foreground-300 mb-4" />
                        <p className="text-foreground-500 mb-4">No expenses recorded for this month</p>
                        <Button
                          color="primary"
                          startContent={<IconPlus size={16} />}
                          onPress={openAddExpenseModal}
                        >
                          Add First Expense
                        </Button>
                      </CardBody>
                    </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Expense Category"
              placeholder="Select category"
              selectedKeys={expenseForm.category ? [expenseForm.category] : []}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
              isRequired
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
              placeholder="25000"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              isRequired
            />
          </div>

          <Input
            label="Description"
            placeholder="Detailed description of the expense..."
            value={expenseForm.description}
            onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
            isRequired
          />

          <DatePicker
            label="Expense Date"
            value={expenseForm.date ? new Date(expenseForm.date) : new Date()}
            onChange={(date) => setExpenseForm(prev => ({
              ...prev,
              date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            }))}
            isRequired
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Additional notes or details..."
            value={expenseForm.notes}
            onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
            minRows={3}
          />

          {/* Budget Warning & Preview */}
          {expenseForm.amount && expenseForm.description && selectedMonth && (
            <>
              {/* Budget Check */}
              {(() => {
                const newExpenseAmount = parseFloat(expenseForm.amount) || 0;
                const currentExpenses = selectedExpenses?.totalExpenses || 0;
                const adjustedExpenses = editingExpense
                  ? currentExpenses - editingExpense.amount + newExpenseAmount
                  : currentExpenses + newExpenseAmount;
                const availableBudget = selectedMonth.totalAvailableForSpending || 0;
                const budgetBalance = availableBudget - adjustedExpenses;
                const isOverBudget = budgetBalance < 0;
                const budgetUsage = availableBudget > 0 ? (adjustedExpenses / availableBudget) * 100 : 0;

                return (
                  <Card className={`${isOverBudget ? 'bg-warning-50 dark:bg-warning-900/20 border-warning' : 'bg-primary-50 dark:bg-primary-900/20'}`}>
                    <CardBody className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <IconCalculator size={16} />
                        Budget Impact Analysis
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-foreground-500">Available Budget</p>
                          <p className="font-semibold text-primary">{formatCurrency(availableBudget)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground-500">Current Expenses</p>
                          <p className="font-semibold text-danger">{formatCurrency(currentExpenses)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground-500">After This Expense</p>
                          <p className="font-semibold text-danger">{formatCurrency(adjustedExpenses)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground-500">Remaining Budget</p>
                          <p className={`font-semibold ${isOverBudget ? 'text-warning' : 'text-success'}`}>
                            {formatCurrency(budgetBalance)}
                          </p>
                        </div>
                      </div>

                      {isOverBudget && (
                        <div className="flex items-center gap-2 p-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                          <IconAlertTriangle size={20} className="text-warning flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-warning">Budget Exceeded!</p>
                            <p className="text-sm text-warning-600">
                              This expense will put you ₹{formatCurrency(Math.abs(budgetBalance)).replace('₹', '')} over the available budget for {selectedMonth.month}.
                            </p>
                          </div>
                        </div>
                      )}

                      {budgetUsage >= 80 && !isOverBudget && (
                        <div className="flex items-center gap-2 p-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                          <IconAlertCircle size={20} className="text-warning flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-warning">High Budget Usage</p>
                            <p className="text-sm text-warning-600">
                              You'll be using {budgetUsage.toFixed(1)}% of your available budget for {selectedMonth.month}.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })()}

              {/* Expense Preview */}
              <Card className="bg-content2">
                <CardBody className="p-4">
                  <h4 className="font-semibold mb-2">Expense Preview</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{expenseForm.description}</p>
                      <p className="text-sm text-foreground-500">{expenseForm.category}</p>
                    </div>
                    <span className="text-lg font-bold text-danger">
                      {formatCurrency(parseFloat(expenseForm.amount) || 0)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}