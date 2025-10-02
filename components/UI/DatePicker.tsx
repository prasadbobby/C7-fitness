"use client";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import "./DatePicker.css";
import { Input } from "@nextui-org/input";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { IconCalendar } from "@tabler/icons-react";

interface DatePickerProps {
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

export default function DatePicker({
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
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(date);
    }
  };

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
          <PopoverContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              defaultMonth={selectedDate}
              showOutsideDays
              fixedWeeks
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      }
    />
  );
}