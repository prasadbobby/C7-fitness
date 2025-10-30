"use client";

import { useState } from "react";
import { Avatar, Button, useDisclosure } from "@nextui-org/react";
import {
  IconCalendar,
  IconTarget,
  IconRulerMeasure,
  IconSettings,
  IconEdit
} from "@tabler/icons-react";
import Link from "next/link";
import BottomSheet from "@/components/UI/BottomSheet";
import EnhancedDatePicker from "@/components/UI/EnhancedDatePicker";
import { handleUpdateUserDetails } from "@/server-actions/UserServerActions";
import { toast } from "sonner";

interface ProfileHeroProps {
  userImage?: string;
  username?: string;
  firstName?: string;
  email?: string;
  age?: number | null;
  currentHeight?: number | null;
  currentWeight?: number | null;
  weightUnit?: string;
  bmi?: string | null;
  currentTrainingProgression?: {
    trainingType: string;
  } | null;
  dateOfBirth?: Date | null;
}

export default function ProfileHero({
  userImage,
  username,
  firstName,
  email,
  age,
  currentHeight,
  currentWeight,
  weightUnit,
  bmi,
  currentTrainingProgression,
  dateOfBirth,
}: ProfileHeroProps) {
  const { isOpen: isDateOfBirthOpen, onOpen: onDateOfBirthOpen, onClose: onDateOfBirthClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(dateOfBirth || null);

  const handleDateOfBirthUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await handleUpdateUserDetails({
        username: username || "",
        firstName: firstName || "",
        lastName: "", // We don't have lastName in this component
        dateOfBirth: selectedDate,
      });

      if (response.success) {
        toast.success("Date of birth updated successfully");
        onDateOfBirthClose();
        window.location.reload();
      } else {
        toast.error(response.message || "Failed to update date of birth");
      }
    } catch (error) {
      console.error("Date of birth update error:", error);
      toast.error("Failed to update date of birth");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-divider">
        {/* Mobile Layout */}
        <div className="block md:hidden p-5">
          {/* Top row: Avatar and Settings */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={userImage}
                name={username || firstName || "User"}
                size="lg"
                className="w-16 h-16 border-2 border-content2"
                showFallback
              />
              <div>
                <h1 className="text-xl font-semibold text-foreground leading-tight">
                  {firstName || username || "User"}
                </h1>
                <p className="text-foreground-500 text-sm">
                  {username && firstName ? `@${username}` : email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Date of Birth Icon for Mobile */}
              <Button
                color="primary"
                variant="flat"
                size="sm"
                isIconOnly
                onPress={onDateOfBirthOpen}
                className="bg-primary/10"
                title="Edit Date of Birth"
              >
                <IconCalendar size={16} />
              </Button>
              <Button
                as={Link}
                href="/profile/advanced"
                color="primary"
                variant="flat"
                size="sm"
                isIconOnly
                title="Advanced Settings"
              >
                <IconSettings size={18} />
              </Button>
            </div>
          </div>

          {/* Bottom: Badges */}
          <div className="grid grid-cols-2 gap-2">
            {currentTrainingProgression?.trainingType && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/15 border border-primary/30 rounded-lg">
                <IconTarget size={14} className="text-primary" />
                <span className="text-xs font-medium text-primary truncate">
                  {currentTrainingProgression.trainingType.replace('_', ' ')}
                </span>
              </div>
            )}
            {age && (
              <div className="flex items-center gap-2 px-3 py-2 bg-content2 rounded-lg">
                <IconCalendar size={14} className="text-foreground-600" />
                <span className="text-xs text-foreground-700">{age} years</span>
              </div>
            )}
            {currentHeight && (
              <div className="flex items-center gap-2 px-3 py-2 bg-content2 rounded-lg">
                <IconRulerMeasure size={14} className="text-foreground-600" />
                <span className="text-xs text-foreground-700">{currentHeight} cm</span>
              </div>
            )}
            {currentWeight && (
              <div className="flex items-center gap-2 px-3 py-2 bg-content2 rounded-lg">
                <span className="text-xs text-foreground-700">{currentWeight} {weightUnit || 'kg'}</span>
              </div>
            )}
            {bmi && (
              <div className="flex items-center gap-2 px-3 py-2 bg-content2 rounded-lg">
                <span className="text-xs text-foreground-700">BMI {bmi}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:flex-col lg:flex-row lg:items-center justify-between gap-6 p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar
                src={userImage}
                name={username || firstName || "User"}
                size="lg"
                className="w-24 h-24 border-4 border-white"
                showFallback
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {firstName || username || "User"}
              </h1>
              <p className="text-foreground-500 text-lg mb-3">
                {username && firstName ? `@${username}` : email}
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {currentTrainingProgression?.trainingType && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                    <IconTarget size={14} className="text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {currentTrainingProgression.trainingType.replace('_', ' ')}
                    </span>
                  </div>
                )}
                {age && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-content2 rounded-full">
                    <IconCalendar size={14} className="text-primary" />
                    <span className="text-sm">{age} years</span>
                  </div>
                )}
                {currentHeight && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-content2 rounded-full">
                    <span className="text-sm">📏 {currentHeight} cm</span>
                  </div>
                )}
                {currentWeight && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-content2 rounded-full">
                    <span className="text-sm">⚖️ {currentWeight} {weightUnit || 'kg'}</span>
                  </div>
                )}
                {bmi && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-content2 rounded-full">
                    <span className="text-sm">BMI: {bmi}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              color="primary"
              variant="flat"
              startContent={<IconCalendar size={16} />}
              onPress={onDateOfBirthOpen}
              className="font-semibold"
            >
              Edit Date of Birth
            </Button>
            <Button
              as={Link}
              href="/profile/advanced"
              color="primary"
              variant="solid"
              startContent={<IconSettings size={18} />}
              className="font-semibold"
            >
              Advanced Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Date of Birth Bottom Sheet */}
      <BottomSheet
        isOpen={isDateOfBirthOpen}
        onClose={onDateOfBirthClose}
        title="Set Date of Birth"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="flat" onPress={onDateOfBirthClose} className="flex-1">
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleDateOfBirthUpdate}
              isLoading={isLoading}
              className="flex-1"
            >
              Save Date
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <EnhancedDatePicker
            label="Date of Birth"
            value={selectedDate || undefined}
            onChange={(date: Date | undefined) => setSelectedDate(date || null)}
            placeholder="Select your date of birth"
          />
          <div className="p-3 bg-content2 rounded-lg">
            <p className="text-xs text-foreground-500">
              📅 Setting your date of birth helps us provide personalized fitness recommendations and calculate your age automatically.
            </p>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
