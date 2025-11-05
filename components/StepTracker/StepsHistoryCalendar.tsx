"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  useDisclosure,
  Chip,
  Progress
} from "@nextui-org/react";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconTarget,
  IconTrophy,
  IconX
} from "@tabler/icons-react";
import BottomSheet from "@/components/UI/BottomSheet";

interface DayStepData {
  date: string;
  actualSteps: number;
  targetSteps: number;
  isCompleted: boolean;
  dataSource: string;
}

interface StepsHistoryCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StepsHistoryCalendar({ isOpen, onClose }: StepsHistoryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stepData, setStepData] = useState<DayStepData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayStepData | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStepDataForMonth();
    }
  }, [isOpen, currentMonth]);

  const fetchStepDataForMonth = async () => {
    setLoading(true);
    try {
      // Get first and last day of the month
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const response = await fetch('/api/fitbit/steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: firstDay.toISOString(),
          endDate: lastDay.toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStepData(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching step data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepDataForDate = (date: Date): DayStepData | null => {
    const dateStr = date.toISOString().split('T')[0];
    return stepData.find(data => data.date.startsWith(dateStr)) || null;
  };

  const getProgressColor = (completed: boolean, percentage: number) => {
    if (completed) return 'success';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'primary';
    return 'default';
  };

  const getProgressPercentage = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];
    const today = new Date();

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 w-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayData = getStepDataForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today;

      days.push(
        <div
          key={day}
          className={`h-12 w-12 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200 ${
            isToday ? 'ring-2 ring-primary' : ''
          } ${isFuture ? 'opacity-50' : 'hover:bg-content2'}`}
          onClick={() => !isFuture && dayData && setSelectedDay(dayData)}
        >
          <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {day}
          </span>

          {dayData && !isFuture && (
            <div className="w-8 h-1 rounded-full mt-1">
              <Progress
                value={getProgressPercentage(dayData.actualSteps, dayData.targetSteps)}
                color={getProgressColor(dayData.isCompleted, getProgressPercentage(dayData.actualSteps, dayData.targetSteps))}
                size="sm"
                className="w-full h-1"
              />
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Steps History Calendar"
    >
      <div className="p-4 max-h-[80vh] overflow-y-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigateMonth('prev')}
          >
            <IconChevronLeft size={20} />
          </Button>

          <h3 className="text-lg font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>

          <Button
            isIconOnly
            variant="light"
            onPress={() => navigateMonth('next')}
          >
            <IconChevronRight size={20} />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-foreground-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Progress Legend</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-success rounded-full"></div>
              <span>Goal Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-warning rounded-full"></div>
              <span>75%+ Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-primary rounded-full"></div>
              <span>50%+ Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-default rounded-full"></div>
              <span>Below 50%</span>
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <h4 className="text-sm font-medium">Monthly Summary</h4>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-foreground-500">Total Days</p>
                <p className="font-semibold">{stepData.length}</p>
              </div>
              <div>
                <p className="text-foreground-500">Goals Met</p>
                <p className="font-semibold text-success">
                  {stepData.filter(d => d.isCompleted).length}
                </p>
              </div>
              <div>
                <p className="text-foreground-500">Total Steps</p>
                <p className="font-semibold">
                  {stepData.reduce((sum, d) => sum + d.actualSteps, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-foreground-500">Avg Steps</p>
                <p className="font-semibold">
                  {stepData.length > 0
                    ? Math.round(stepData.reduce((sum, d) => sum + d.actualSteps, 0) / stepData.length).toLocaleString()
                    : '0'
                  }
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Selected Day Details */}
        {selectedDay && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h4 className="text-sm font-medium">
                {new Date(selectedDay.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h4>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setSelectedDay(null)}
              >
                <IconX size={16} />
              </Button>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-500">Steps</span>
                  <span className="font-semibold">{selectedDay.actualSteps.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-500">Target</span>
                  <span className="font-semibold">{selectedDay.targetSteps.toLocaleString()}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground-500">Progress</span>
                    <span className="font-semibold">
                      {getProgressPercentage(selectedDay.actualSteps, selectedDay.targetSteps).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={getProgressPercentage(selectedDay.actualSteps, selectedDay.targetSteps)}
                    color={getProgressColor(
                      selectedDay.isCompleted,
                      getProgressPercentage(selectedDay.actualSteps, selectedDay.targetSteps)
                    )}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-500">Status</span>
                  <Chip
                    size="sm"
                    color={selectedDay.isCompleted ? 'success' : 'default'}
                    startContent={selectedDay.isCompleted ? <IconTrophy size={14} /> : <IconTarget size={14} />}
                  >
                    {selectedDay.isCompleted ? 'Completed' : 'In Progress'}
                  </Chip>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-500">Source</span>
                  <Chip size="sm" variant="flat">
                    {selectedDay.dataSource}
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </BottomSheet>
  );
}