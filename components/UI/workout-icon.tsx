'use client';

import type { Variants } from 'framer-motion';
import { motion, useAnimation } from 'framer-motion';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface WorkoutIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WorkoutIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const strokeVariants: Variants = {
  normal: {
    pathLength: 1,
    pathOffset: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    pathLength: [0, 1],
    pathOffset: [1, 0],
    opacity: [0, 1],
    transition: {
      duration: 1.2,
      ease: 'easeInOut',
      opacity: { duration: 0.2 },
    },
  },
};

const WorkoutIcon = forwardRef<WorkoutIconHandle, WorkoutIconProps>(
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
          viewBox="0 0 512 512"
          fill="none"
          stroke="currentColor"
          strokeWidth="38"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Dumbbell main body */}
          <motion.path
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            d="M495.841 101.383h-13.617V55.788a8.537 8.537 0 0 0-8.537-8.537h-23.323a8.537 8.537 0 0 0-8.537 8.537v45.595h-29.811"
          />

          {/* Left weight plate */}
          <motion.path
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            d="M412.016 101.383c1.243-13.058-8.373-24.492-21.113-25.839-13.105-1.382-24.726 8.197-26.09 21.099l-.501 4.739h-41.088"
          />

          {/* Center handle connection */}
          <motion.path
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            d="M323.224 101.383c-12.121 26.171-38.282 43.068-67.261 43.068-29.378 0-55.317-17.281-67.261-43.068h-40.938"
          />

          {/* Right weight plate */}
          <motion.path
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            d="M147.764 101.383l-.501-4.739c-1.375-12.998-13.102-22.474-26.09-21.1-12.723 1.347-22.358 12.768-21.113 25.841H70.171"
          />

          {/* Left side structure */}
          <motion.rect
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            x="29.774"
            y="47.252"
            width="23.323"
            height="133.581"
            rx="8.537"
          />

          {/* Right side structure */}
          <motion.rect
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            x="450.364"
            y="47.252"
            width="23.323"
            height="133.581"
            rx="8.537"
          />

          {/* Person figure - body */}
          <motion.path
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            d="M112.783 222.83c1.023 9.669 8.253 78.036 9.321 88.147 2.145 20.289 27.705 28.867 41.462 13.117l33.346-38.161v90.784l-86.282 35.055a30.852 30.852 0 0 0-18.886 23.93L65.21 459.425c-2.57 16.845 9.002 32.582 25.846 35.151"
          />

          {/* Person figure - arms and body center */}
          <motion.path
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            d="M196.912 376.588h118.176l79.818 32.429 14.572 95.523c2.57 16.846 18.307 28.415 35.151 25.846 16.844-2.57 28.415-18.307 25.846-35.151l-17.215-112.853a30.854 30.854 0 0 0-18.886-23.93l-86.966-35.334V195.99l34.055 38.974c13.39 15.326 39.255 7.732 41.462-13.117l9.323-88.147"
          />

          {/* Person head */}
          <motion.circle
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            cx="255.963"
            cy="70.351"
            r="53.284"
          />
        </svg>
      </div>
    );
  }
);

WorkoutIcon.displayName = 'WorkoutIcon';

export { WorkoutIcon };