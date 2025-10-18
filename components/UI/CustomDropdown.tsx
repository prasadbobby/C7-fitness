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
  position?: { top: number; left: number };
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
    relative flex w-full cursor-pointer select-none items-center rounded-small px-2 py-1.5 text-small subpixel-antialiased outline-none transition-colors hover:bg-default-100 active:bg-default-200 data-[hover=true]:bg-default-100 data-[selectable=true]:focus:bg-default-100 data-[pressed=true]:opacity-70 data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 tap-highlight-transparent
    ${danger ? "text-danger" : "text-foreground"}
    ${className}
  `;

  return (
    <button className={baseClasses} onClick={onClick}>
      {startContent && <span className="flex-shrink-0 mr-2">{startContent}</span>}
      <span>{children}</span>
    </button>
  );
};

// DropdownSection Component
export const DropdownSection: React.FC<DropdownSectionProps> = ({
  children,
  showDivider = false,
}) => {
  return (
    <div className={showDivider ? "border-b border-divider pb-1 mb-1" : ""}>
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
  position = { top: 0, left: 0 },
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
      fixed min-w-[160px] bg-content1 shadow-large rounded-large border border-divider backdrop-blur-md backdrop-saturate-150 py-1
      ${className}
    `}
    style={{
      top: `${position.top}px`,
      left: `${position.left}px`,
      zIndex: 999999
    }}>
      {topContent && (
        <div className="px-2 py-2 border-b border-divider">
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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 160 // align to right
      });
    }
  };

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

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen]);

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
          position: position,
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
    <div className={`relative inline-block ${className}`} ref={dropdownRef} style={{ zIndex: 999998 }}>
      {trigger}
      {isOpen && menu}
    </div>
  );
};