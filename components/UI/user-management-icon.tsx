'use client';

import type { Variants } from 'framer-motion';
import { motion, useAnimation } from 'framer-motion';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface UserManagementIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface UserManagementIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const pathVariant: Variants = {
  normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
  },
};

const circleVariant: Variants = {
  normal: {
    pathLength: 1,
    pathOffset: 0,
    scale: 1,
  },
  animate: {
    pathLength: [0, 1],
    pathOffset: [1, 0],
    scale: [0.5, 1],
  },
};

const UserManagementIcon = forwardRef<UserManagementIconHandle, UserManagementIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start('animate');
        } else {
          onMouseEnter?.(e);
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start('normal');
        } else {
          onMouseLeave?.(e);
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.circle
            cx="9"
            cy="6"
            r="6"
            animate={controls}
            variants={circleVariant}
          />

          <motion.path
            d="M5 14h3v2H5c-1.654 0-3 1.346-3 3v5H0v-5c0-2.757 2.243-5 5-5Z"
            variants={pathVariant}
            transition={{
              delay: 0.1,
              duration: 0.4,
            }}
            animate={controls}
          />

          <motion.circle
            cx="17"
            cy="17"
            r="3"
            animate={controls}
            variants={circleVariant}
          />

          <motion.path
            d="M22 17c0-.552-.09-1.082-.256-1.579l1.82-1.049-.998-1.733-1.823 1.05A5.009 5.009 0 0 0 18 12.1V9.999h-2V12.1a5.005 5.005 0 0 0-2.743 1.589l-1.823-1.05-.998 1.733 1.82 1.049C12.09 15.918 12 16.448 12 17s.09 1.082.256 1.579l-1.82 1.049.998 1.733 1.823-1.05A5.009 5.009 0 0 0 16 21.9v2.101h2V21.9a5.005 5.005 0 0 0 2.743-1.589l1.823 1.05.998-1.733-1.82-1.049A4.971 4.971 0 0 0 22 17Z"
            variants={pathVariant}
            transition={{
              delay: 0.2,
              duration: 0.4,
            }}
            animate={controls}
          />
        </svg>
      </div>
    );
  }
);

UserManagementIcon.displayName = 'UserManagementIcon';

export { UserManagementIcon };