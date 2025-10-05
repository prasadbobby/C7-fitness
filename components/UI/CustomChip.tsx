"use client";
import React, { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  variant?: "solid" | "flat" | "dot";
  size?: "sm" | "md" | "lg";
  className?: string;
  radius?: "sm" | "md" | "lg" | "full";
}

const CustomChip: React.FC<ChipProps> = ({
  children,
  color = "default",
  variant = "solid",
  size = "md",
  className = "",
  radius = "md",
}) => {
  // Base styles
  const baseClasses = `
    inline-flex items-center justify-center gap-1 font-medium
    transition-all duration-200
  `;

  // Size styles
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  // Radius styles
  const radiusClasses = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  // Color and variant styles
  const getColorClasses = () => {
    const colorMap = {
      default: {
        solid: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
        flat: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        dot: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 relative pl-4",
      },
      primary: {
        solid: "bg-blue-600 text-white",
        flat: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        dot: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 relative pl-4",
      },
      secondary: {
        solid: "bg-gray-600 text-white",
        flat: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        dot: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 relative pl-4",
      },
      success: {
        solid: "bg-green-600 text-white",
        flat: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        dot: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 relative pl-4",
      },
      warning: {
        solid: "bg-yellow-600 text-white",
        flat: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        dot: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 relative pl-4",
      },
      danger: {
        solid: "bg-red-600 text-white",
        flat: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        dot: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 relative pl-4",
      },
    };

    return colorMap[color][variant];
  };

  const dotColorMap = {
    default: "bg-gray-400",
    primary: "bg-blue-500",
    secondary: "bg-gray-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  const combinedClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${radiusClasses[radius]}
    ${getColorClasses()}
    ${className}
  `;

  return (
    <span className={combinedClasses}>
      {variant === "dot" && (
        <span className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full ${dotColorMap[color]}`} />
      )}
      {children}
    </span>
  );
};

export default CustomChip;