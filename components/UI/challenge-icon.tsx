'use client';

import type { Variants } from 'framer-motion';
import { motion, useAnimation } from 'framer-motion';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ChallengeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChallengeIconProps extends HTMLAttributes<HTMLDivElement> {
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

const ChallengeIcon = forwardRef<ChallengeIconHandle, ChallengeIconProps>(
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
          viewBox="0 0 28 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main target/circle path */}
          <motion.path
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            d="M23.376 11.78c-.55.56-1.33.88-2.12.88h-1.7l-.03.03c.17.58.27 1.2.27 1.84 0 3.46-2.82 6.28-6.29 6.28a6.29 6.29 0 0 1-6.28-6.28c0-3.47 2.82-6.29 6.28-6.29.6 0 1.19.08 1.74.25l.05-.05V6.71c0-.81.31-1.56.88-2.12l.95-.95a11.24 11.24 0 0 0-3.61-.59c-6.33 0-11.48 5.15-11.48 11.47 0 6.33 5.15 11.48 11.48 11.48s11.47-5.15 11.47-11.48c0-1.28-.21-2.53-.63-3.72z"
          />

          {/* Arrow/flag path */}
          <motion.path
            variants={strokeVariants}
            animate={controls}
            initial="normal"
            d="M25.906 5.62a1.01 1.01 0 0 0-.87-.65l-1.9-.14-.14-1.9a1.01 1.01 0 0 0-.65-.87c-.36-.13-.78-.04-1.05.23L17.586 6a.99.99 0 0 0-.29.71v2.55l-2.453 2.484a3.068 3.068 0 0 0-1.337-.315c-1.7 0-3.09 1.39-3.09 3.09a3.1 3.1 0 0 0 3.09 3.1c1.71 0 3.1-1.39 3.1-3.1a3.04 3.04 0 0 0-.338-1.371l2.448-2.489h2.54c.26 0 .52-.1.71-.29l3.7-3.7a1 1 0 0 0 .24-1.05z"
          />
        </svg>
      </div>
    );
  }
);

ChallengeIcon.displayName = 'ChallengeIcon';

export { ChallengeIcon };