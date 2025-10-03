"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Button } from "@nextui-org/button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface DayPost {
  date: string;
  hasPost: boolean;
  mood?: string;
  energy?: string;
}

export function ChallengeCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<DayPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [challengeStart, setChallengeStart] = useState<Date>(new Date());
  const [challengeEnd, setChallengeEnd] = useState<Date>(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

  useEffect(() => {
    fetchChallengeInfo();
    fetchMonthPosts();
  }, [currentDate]);

  const fetchChallengeInfo = async () => {
    try {
      const response = await fetch('/api/ninety-day-challenge/info');
      if (response.ok) {
        const data = await response.json();
        setChallengeStart(new Date(data.startDate));
        setChallengeEnd(new Date(data.endDate));
      }
    } catch (error) {
      console.error('Error fetching challenge info:', error);
    }
  };

  const fetchMonthPosts = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const response = await fetch(`/api/ninety-day-challenge/posts/calendar?month=${month}&year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching month posts:', error);
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];

    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Render header
    const header = (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
          <div key={dayName} className="p-2 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {dayName}
          </div>
        ))}
      </div>
    );

    // Render days
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayPost = posts.find(post => isSameDay(new Date(post.date), day));
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isChallengeDay = day >= challengeStart && day <= challengeEnd;
        const isPastChallengeDay = day < new Date() && isChallengeDay;

        days.push(
          <div
            key={day.toString()}
            className={`relative p-2 h-16 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors ${
              !isCurrentMonth
                ? 'text-zinc-400 bg-zinc-50 dark:bg-zinc-900'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            } ${
              isToday ? 'bg-primary/10 border-primary' : ''
            } ${
              selectedDate && isSameDay(cloneDay, selectedDate) ? 'bg-primary/20' : ''
            }`}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="text-sm font-medium">{formattedDate}</div>

            {/* Challenge indicators */}
            <div className="absolute bottom-1 left-1 right-1 flex justify-center">
              {isChallengeDay && (
                <div className="flex gap-1">
                  {dayPost?.hasPost ? (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  ) : isPastChallengeDay ? (
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
                  )}
                </div>
              )}
            </div>

            {/* Mood indicator */}
            {dayPost?.mood && (
              <div className="absolute top-1 right-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  dayPost.mood === 'EXCELLENT' ? 'bg-green-500' :
                  dayPost.mood === 'VERY_GOOD' ? 'bg-green-400' :
                  dayPost.mood === 'GOOD' ? 'bg-yellow-500' :
                  dayPost.mood === 'NEUTRAL' ? 'bg-zinc-400' :
                  'bg-red-500'
                }`}></div>
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div>
        {header}
        {rows}
      </div>
    );
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="flat"
            startContent={<IconChevronLeft size={16} />}
            onPress={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            Previous
          </Button>

          <h3 className="text-lg font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h3>

          <Button
            size="sm"
            variant="flat"
            endContent={<IconChevronRight size={16} />}
            onPress={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            Next
          </Button>
        </div>

        {/* Calendar Grid */}
        {renderCalendar()}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Posted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
            <span>Upcoming</span>
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <h4 className="font-medium mb-2">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h4>
            {selectedDate >= challengeStart && selectedDate <= challengeEnd ? (
              <div className="space-y-2">
                {posts.find(post => isSameDay(new Date(post.date), selectedDate))?.hasPost ? (
                  <Chip color="success" size="sm">Posted</Chip>
                ) : selectedDate < new Date() ? (
                  <Chip color="danger" size="sm">Missed</Chip>
                ) : selectedDate.toDateString() === new Date().toDateString() ? (
                  <Chip color="warning" size="sm">Today - Post your update!</Chip>
                ) : (
                  <Chip color="default" size="sm">Upcoming</Chip>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Not part of challenge period</p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}