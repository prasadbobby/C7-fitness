"use client";
import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import "./EnhancedDatePicker.css";
import { Input } from "@nextui-org/input";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { IconCalendar } from "@tabler/icons-react";

interface EnhancedDatePickerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  isRequired?: boolean;
  errorMessage?: string;
  className?: string;
  disabled?: boolean;
  placement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end";
}

export default function EnhancedDatePicker({
  label = "Date",
  size = "md",
  value,
  onChange,
  placeholder = "Select date",
  isRequired = false,
  errorMessage,
  className,
  disabled = false,
  placement = "bottom"
}: EnhancedDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  // Sync selectedDate with value prop changes
  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(date);
    }
  };

  // Calculate appropriate date range for date of birth
  const currentYear = new Date().getFullYear();

  return (
    <Input
      label={label}
      size={size}
      readOnly
      value={selectedDate ? format(selectedDate, "dd-MM-yyyy") : ""}
      placeholder={placeholder}
      isRequired={isRequired}
      errorMessage={errorMessage}
      className={className}
      isDisabled={disabled}
      endContent={
        <Popover placement={placement}>
          <PopoverTrigger>
            <IconCalendar className={`cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              defaultMonth={selectedDate || new Date(currentYear - 25, 0, 1)} // Default to 25 years ago
              showOutsideDays
              fixedWeeks
              disabled={disabled}
              captionLayout="dropdown-buttons"
              fromYear={currentYear - 100}
              toYear={currentYear}
              classNames={{
                caption: "flex justify-center py-2 mb-4 relative items-center",
                caption_dropdowns: "flex justify-center gap-2",
                nav: "flex items-center",
                table: "w-full",
                head_row: "flex",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative",
                day_hidden: "invisible",
              }}
            />
          </PopoverContent>
        </Popover>
      }
    />
  );
}