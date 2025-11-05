"use client";

import React from 'react';
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Progress } from "@nextui-org/progress";
import { IconCalendar, IconTarget } from "@tabler/icons-react";

interface DayStepData {
  date: string;
  actualSteps: number;
  targetSteps: number;
  isCompleted: boolean;
  completionPercentage: number;
}

interface WeeklyStepBreakdownProps {
  weeklyData: DayStepData[];
  isLoading?: boolean;
}

const DAYS_OF_WEEK = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' }
];

export default function WeeklyStepBreakdown({ weeklyData, isLoading = false }: WeeklyStepBreakdownProps) {

  // Get Monday-based week data using IST timezone (same as API endpoints)
  const getMondayBasedWeekData = () => {
    // Use IST timezone calculation (same as step-dashboard and weekly-sync APIs)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istNow = new Date(now.getTime() + istOffset);
    const today = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));

    const currentDay = today.getDay();

    // If today is Monday, show the week that just ended (includes yesterday's Sunday)
    // Otherwise show the current ongoing week
    let mondayDate;
    if (currentDay === 1) { // Monday
      // Show previous week (Mon-Sun) that just completed
      mondayDate = new Date(today.getTime());
      mondayDate.setUTCDate(today.getUTCDate() - 7);
    } else {
      // Show current ongoing week
      const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
      mondayDate = new Date(today.getTime());
      mondayDate.setUTCDate(today.getUTCDate() - mondayOffset);
    }

    // Get Monday of the target week (use UTC methods to avoid timezone issues)
    const monday = new Date(mondayDate.getTime());
    monday.setUTCHours(0, 0, 0, 0);

    const weekData = DAYS_OF_WEEK.map((day, index) => {
      const date = new Date(monday.getTime());
      date.setUTCDate(monday.getUTCDate() + index);
      const dateString = date.toISOString().split('T')[0];

      // Find matching data for this date
      const dayData = weeklyData.find(data =>
        data.date.split('T')[0] === dateString
      );

      // Check if this date is actually in the future (not just past midnight)
      const isActuallyFuture = date.getTime() > today.getTime();

      return {
        day: day.short,
        fullDay: day.full,
        date: dateString,
        actualSteps: dayData?.actualSteps || 0,
        targetSteps: dayData?.targetSteps || 10000,
        isCompleted: dayData?.isCompleted || false,
        completionPercentage: dayData?.completionPercentage || 0,
        hasData: !!dayData,
        isToday: dateString === today.toISOString().split('T')[0],
        isFuture: isActuallyFuture
      };
    });

    return weekData;
  };

  const weekData = getMondayBasedWeekData();
  const weekTotal = weekData.reduce((sum, day) => sum + day.actualSteps, 0);
  const weekTarget = weekData.reduce((sum, day) => sum + day.targetSteps, 0);
  const weekCompletionPercentage = weekTarget > 0 ? Math.round((weekTotal / weekTarget) * 100) : 0;
  const completedDays = weekData.filter(day => day.isCompleted).length;

  if (isLoading) {
    return (
      <Card shadow="none" className="shadow-md">
        <CardHeader className="px-3 text-xs uppercase">
          <div className="flex items-center gap-2">
            <IconCalendar size={18} className="text-primary" />
            <span>Daily Breakdown</span>
          </div>
        </CardHeader>
        <CardBody className="px-3 pt-0">
          <div className="space-y-3">
            {/* Loading week summary */}
            <div className="animate-pulse">
              <div className="bg-default-200 rounded h-4 w-3/4 mb-2"></div>
              <div className="bg-default-100 rounded h-6 w-1/2"></div>
            </div>

            {/* Loading daily breakdown */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="bg-default-200 rounded h-3 w-8 mx-auto mb-2"></div>
                  <div className="bg-default-100 rounded h-4 w-10 mx-auto mb-1"></div>
                  <div className="bg-default-200 rounded h-3 w-12 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card shadow="none" className="shadow-md">
      <CardHeader className="px-3 text-xs uppercase">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <IconCalendar size={18} className="text-primary" />
            <span>Daily Breakdown</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground-500">
            <IconTarget size={14} />
            <span>{completedDays}/7 days</span>
          </div>
        </div>
      </CardHeader>

      <CardBody className="px-3 pt-0">
        <div className="space-y-4">
          {/* Week Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground-600">Week Total</span>
              <span className="text-lg font-bold text-foreground">
                {weekTotal.toLocaleString()}
              </span>
            </div>
            <Progress
              value={Math.min(weekCompletionPercentage, 100)}
              color={weekCompletionPercentage >= 100 ? 'success' : weekCompletionPercentage >= 70 ? 'primary' : 'warning'}
              className="w-full"
              size="sm"
            />
            <div className="flex items-center justify-between text-xs text-foreground-500">
              <span>Target: {weekTarget.toLocaleString()}</span>
              <span>{weekCompletionPercentage}% complete</span>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground-600">This Week</h4>
            <div className="grid grid-cols-7 gap-2">
              {weekData.map((day, index) => (
                <div
                  key={index}
                  className={`text-center p-2 rounded-lg transition-colors ${
                    day.isToday
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : day.isFuture
                      ? 'bg-default-50 dark:bg-default-900/20'
                      : 'bg-default-100 dark:bg-default-800/50'
                  }`}
                >
                  {/* Day name */}
                  <div className={`text-xs font-medium mb-1 ${
                    day.isToday ? 'text-primary-600 dark:text-primary-400' : 'text-foreground-500'
                  }`}>
                    {day.day}
                  </div>

                  {/* Progress percentage */}
                  <div className={`text-sm font-bold mb-1 ${
                    day.isFuture
                      ? 'text-foreground-300'
                      : day.isCompleted
                      ? 'text-success-600 dark:text-success-400'
                      : day.completionPercentage >= 50
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-warning-600 dark:text-warning-400'
                  }`}>
                    {day.isFuture ? '—' : `${day.completionPercentage}%`}
                  </div>

                  {/* Step count */}
                  <div className={`text-xs ${
                    day.isFuture
                      ? 'text-foreground-300'
                      : 'text-foreground-600'
                  }`}>
                    {day.isFuture ? '—' : day.actualSteps.toLocaleString()}
                  </div>

                  {/* Completion indicator */}
                  {!day.isFuture && (
                    <div className="mt-1">
                      <div className={`w-full h-1 rounded-full ${
                        day.isCompleted
                          ? 'bg-success-400'
                          : day.completionPercentage >= 50
                          ? 'bg-primary-400'
                          : day.hasData
                          ? 'bg-warning-400'
                          : 'bg-default-300'
                      }`}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Week Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-default-200 dark:border-default-700">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {Math.round(weekTotal / 7).toLocaleString()}
              </div>
              <div className="text-xs text-foreground-500">Daily Average</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {completedDays}
              </div>
              <div className="text-xs text-foreground-500">Goals Met</div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}