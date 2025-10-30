'use client';

import type { Variants } from 'framer-motion';
import { motion, useAnimation } from 'framer-motion';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface CheckmarkBadgeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CheckmarkBadgeIconProps extends HTMLAttributes<HTMLDivElement> {
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

const CheckmarkBadgeIcon = forwardRef<CheckmarkBadgeIconHandle, CheckmarkBadgeIconProps>(
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
          version="1.1"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <motion.path
            d="m16.232 8.681-3.235 3.476a2.785 2.785 0 0 1-3.969.026l-1.476-1.476a.999.999 0 1 1 1.414-1.414l1.476 1.476a.807.807 0 0 0 1.115 0l3.211-3.45a1 1 0 0 1 1.464 1.362Zm7.693 11.45c-.226.543-.729.88-1.316.88h-1.562v1.562c0 .893-.729 1.427-1.435 1.427-.377 0-.722-.145-.997-.42l-4.366-4.366-.006-.009c-.167.134-.331.271-.525.379-.522.29-1.108.435-1.693.435s-1.171-.145-1.694-.435c-.197-.109-.365-.248-.535-.385l-.01.016-4.366 4.366c-.274.275-.619.42-.997.42-.705 0-1.434-.534-1.434-1.427v-1.562H1.427a1.402 1.402 0 0 1-1.316-.878 1.403 1.403 0 0 1 .309-1.553l3.541-3.54a3.534 3.534 0 0 1 .051-1.256c.065-.285-.072-.592-.34-.765a3.606 3.606 0 0 1-1.202-1.297 3.497 3.497 0 0 1-.432-1.709 3.48 3.48 0 0 1 .432-1.701 3.581 3.581 0 0 1 1.202-1.297c.268-.173.405-.48.34-.764a3.605 3.605 0 0 1 .059-1.805 3.523 3.523 0 0 1 2.395-2.395 3.597 3.597 0 0 1 1.803-.059c.287.063.592-.073.765-.341A3.596 3.596 0 0 1 10.331.451a3.52 3.52 0 0 1 3.387 0c.539.299.975.703 1.296 1.202.173.268.483.406.765.34a3.59 3.59 0 0 1 1.804.059 3.524 3.524 0 0 1 2.396 2.395 3.61 3.61 0 0 1 .059 1.806c-.064.284.072.591.34.764a3.59 3.59 0 0 1 1.202 1.297c.285.515.435 1.105.432 1.709a3.48 3.48 0 0 1-.432 1.701 3.603 3.603 0 0 1-1.201 1.297c-.269.173-.406.48-.341.765.095.417.109.842.05 1.269l3.528 3.528c.415.415.533 1.009.309 1.551ZM8.104 18.068a3.617 3.617 0 0 1-1.638-.085 3.48 3.48 0 0 1-1.603-1.017l-2.045 2.045H3.99a1 1 0 0 1 1 1v1.171l3.115-3.115Zm8.118-1.977c.259.059.532.048.811-.031.483-.138.885-.54 1.024-1.023.079-.278.09-.551.031-.811-.25-1.101.235-2.261 1.207-2.888.219-.142.4-.339.537-.586a1.5 1.5 0 0 0 .181-.731 1.516 1.516 0 0 0-.181-.74 1.602 1.602 0 0 0-.537-.586c-.972-.627-1.456-1.787-1.207-2.887.059-.26.049-.533-.031-.812a1.527 1.527 0 0 0-1.024-1.023 1.624 1.624 0 0 0-.811-.031c-1.097.252-2.259-.234-2.887-1.206a1.615 1.615 0 0 0-.585-.537 1.526 1.526 0 0 0-1.448 0 1.62 1.62 0 0 0-.586.537c-.626.971-1.785 1.458-2.888 1.207a1.61 1.61 0 0 0-.81.031c-.483.139-.886.54-1.024 1.023-.08.278-.09.551-.031.812.25 1.099-.235 2.26-1.207 2.887a1.608 1.608 0 0 0-.536.586c-.12.216-.183.469-.181.731-.001.271.062.524.181.74.138.248.318.445.538.587.971.626 1.456 1.787 1.206 2.887-.059.259-.048.533.032.812.139.482.54.884 1.023 1.022.277.08.55.09.809.031.193-.043.388-.065.581-.065.91 0 1.791.47 2.308 1.271.142.219.339.399.586.537a1.524 1.524 0 0 0 1.448 0c.247-.137.444-.318.585-.537.628-.971 1.791-1.457 2.888-1.207Zm4.997 2.92-2.038-2.038a3.47 3.47 0 0 1-1.598 1.009 3.613 3.613 0 0 1-1.653.083l3.117 3.117v-1.171a1 1 0 0 1 1-1h1.172Z"
            variants={pathVariant}
            transition={{
              duration: 0.4,
            }}
            animate={controls}
          />
        </svg>
      </div>
    );
  }
);

CheckmarkBadgeIcon.displayName = 'CheckmarkBadgeIcon';

export { CheckmarkBadgeIcon };