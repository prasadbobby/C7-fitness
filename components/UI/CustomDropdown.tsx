"use client";
import React, { useState, useRef, useEffect, ReactNode } from "react";

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  startContent?: ReactNode;
  danger?: boolean;
}

interface DropdownSectionProps {
  children: ReactNode;
  showDivider?: boolean;
}

interface DropdownMenuProps {
  children: ReactNode;
  onAction?: (key: string) => void;
  topContent?: ReactNode;
  className?: string;
}

interface DropdownProps {
  children: ReactNode;
  className?: string;
}

// DropdownItem Component
export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  className = "",
  startContent,
  danger = false,
}) => {
  const baseClasses = `
    flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors
    hover:bg-gray-100 dark:hover:bg-gray-800
    ${danger ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {startContent && <span className="flex-shrink-0">{startContent}</span>}
      <span>{children}</span>
    </div>
  );
};

// DropdownSection Component
export const DropdownSection: React.FC<DropdownSectionProps> = ({
  children,
  showDivider = false,
}) => {
  return (
    <div className={showDivider ? "border-b border-gray-200 dark:border-gray-700 pb-1 mb-1" : ""}>
      {children}
    </div>
  );
};

// DropdownMenu Component
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  onAction,
  topContent,
  className = "",
}) => {
  const handleItemClick = (key: string) => {
    if (onAction) {
      onAction(key);
    }
  };

  // Clone children and inject onClick handlers
  const processChildren = (children: ReactNode): ReactNode => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === DropdownSection) {
          return React.cloneElement(child, {
            ...child.props,
            children: processChildren(child.props.children),
          });
        }
        if (child.type === DropdownItem) {
          const key = child.key || '';
          return React.cloneElement(child, {
            ...child.props,
            onClick: () => handleItemClick(String(key)),
          });
        }
      }
      return child;
    });
  };

  return (
    <div className={`
      absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-700
      rounded-lg shadow-lg z-50 py-1
      ${className}
    `}>
      {topContent && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          {topContent}
        </div>
      )}
      <div className="py-1">
        {processChildren(children)}
      </div>
    </div>
  );
};

// DropdownTrigger Component
export const DropdownTrigger: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Main Dropdown Component
export const Dropdown: React.FC<DropdownProps> = ({ children, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Process children to find trigger and menu
  let trigger: ReactNode = null;
  let menu: ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === DropdownTrigger) {
        trigger = React.cloneElement(child.props.children, {
          onClick: toggleDropdown,
        });
      } else if (child.type === DropdownMenu) {
        menu = React.cloneElement(child, {
          ...child.props,
          onAction: (key: string) => {
            if (child.props.onAction) {
              child.props.onAction(key);
            }
            setIsOpen(false);
          },
        });
      }
    }
  });

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {trigger}
      {isOpen && menu}
    </div>
  );
};