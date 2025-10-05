"use client";
import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  shadow?: "none" | "sm" | "md" | "lg";
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

// Card Component
export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  shadow = "md",
}) => {
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  const baseClasses = `
    bg-white dark:bg-gray-900
    border border-gray-200 dark:border-gray-700
    rounded-lg overflow-hidden
    ${shadowClasses[shadow]}
    ${className}
  `;

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};

// CardHeader Component
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
}) => {
  const baseClasses = `
    px-4 py-3 border-b border-gray-200 dark:border-gray-700
    ${className}
  `;

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};

// CardBody Component
export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = "",
}) => {
  const baseClasses = `
    px-4 py-3
    ${className}
  `;

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};

// CardFooter Component
export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = "",
}) => {
  const baseClasses = `
    px-4 py-3 border-t border-gray-200 dark:border-gray-700
    ${className}
  `;

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};