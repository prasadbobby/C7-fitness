"use client";
import React, { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  children: ReactNode;
  variant?: "solid" | "flat" | "ghost" | "outlined";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isDisabled?: boolean;
  startContent?: ReactNode;
  endContent?: ReactNode;
  as?: typeof Link;
  href?: string;
  onPress?: () => void;
  className?: string;
}

const CustomButton: React.FC<ButtonProps> = ({
  children,
  variant = "solid",
  color = "default",
  size = "md",
  isLoading = false,
  isDisabled = false,
  startContent,
  endContent,
  as: Component,
  href,
  onPress,
  className = "",
  ...props
}) => {
  // Base styles
  const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-lg font-medium
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Size styles
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Color and variant styles
  const getColorClasses = () => {
    const colorMap = {
      default: {
        solid: "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200",
        flat: "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300",
        ghost: "hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300",
        outlined: "border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300",
      },
      primary: {
        solid: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
        flat: "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300",
        ghost: "hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900 dark:text-blue-400",
        outlined: "border border-blue-300 hover:bg-blue-50 text-blue-600 dark:border-blue-600 dark:hover:bg-blue-900 dark:text-blue-400",
      },
      secondary: {
        solid: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
        flat: "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300",
        ghost: "hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
        outlined: "border border-gray-300 hover:bg-gray-50 text-gray-600 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-400",
      },
      success: {
        solid: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
        flat: "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300",
        ghost: "hover:bg-green-100 text-green-600 dark:hover:bg-green-900 dark:text-green-400",
        outlined: "border border-green-300 hover:bg-green-50 text-green-600 dark:border-green-600 dark:hover:bg-green-900 dark:text-green-400",
      },
      warning: {
        solid: "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500",
        flat: "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-300",
        ghost: "hover:bg-yellow-100 text-yellow-600 dark:hover:bg-yellow-900 dark:text-yellow-400",
        outlined: "border border-yellow-300 hover:bg-yellow-50 text-yellow-600 dark:border-yellow-600 dark:hover:bg-yellow-900 dark:text-yellow-400",
      },
      danger: {
        solid: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        flat: "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300",
        ghost: "hover:bg-red-100 text-red-600 dark:hover:bg-red-900 dark:text-red-400",
        outlined: "border border-red-300 hover:bg-red-50 text-red-600 dark:border-red-600 dark:hover:bg-red-900 dark:text-red-400",
      },
    };

    return colorMap[color][variant];
  };

  const combinedClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${getColorClasses()}
    ${className}
  `;

  const content = (
    <>
      {isLoading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && startContent}
      <span>{children}</span>
      {!isLoading && endContent}
    </>
  );

  const handleClick = () => {
    if (onPress && !isDisabled && !isLoading) {
      onPress();
    }
  };

  if (Component === Link && href) {
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={combinedClasses}
      disabled={isDisabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {content}
    </button>
  );
};

export default CustomButton;