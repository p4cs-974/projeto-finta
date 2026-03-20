"use client";

import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface WifiOffIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface WifiOffIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const WifiOffIcon = forwardRef<WifiOffIconHandle, WifiOffIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();

    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: async () => {
          await controls.start("fadeOut");
          controls.start("fadeIn");
        },
        stopAnimation: () => controls.start("fadeIn"),
      };
    });

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          await controls.start("fadeOut");
          controls.start("fadeIn");
        }
      },
      [controls, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        controls.start("fadeIn");
        onMouseLeave?.(e);
      },
      [controls, onMouseLeave],
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            animate={controls}
            d="M12 20h.01"
            initial={{ opacity: 1 }}
            variants={{
              fadeOut: { opacity: 0, transition: { duration: 0.2 } },
              fadeIn: {
                opacity: 1,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              },
            }}
          />
          <motion.path
            animate={controls}
            d="M8.5 16.429a5 5 0 0 1 7 0"
            initial={{ opacity: 0.5 }}
            variants={{
              fadeOut: { opacity: 0, transition: { duration: 0.2 } },
              fadeIn: {
                opacity: 0.5,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.05,
                },
              },
            }}
          />
          <motion.path
            animate={controls}
            d="M5 12.859a10 10 0 0 1 5.17-2.69"
            initial={{ opacity: 0 }}
            variants={{
              fadeOut: { opacity: 0, transition: { duration: 0.2 } },
              fadeIn: {
                opacity: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.1,
                },
              },
            }}
          />
          <motion.path
            animate={controls}
            d="M2 8.82a15 15 0 0 1 10.54-5.22"
            initial={{ opacity: 0 }}
            variants={{
              fadeOut: { opacity: 0, transition: { duration: 0.2 } },
              fadeIn: {
                opacity: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.15,
                },
              },
            }}
          />
          <motion.line
            animate={controls}
            initial={{ opacity: 1 }}
            variants={{
              fadeOut: { opacity: 1, transition: { duration: 0.2 } },
              fadeIn: {
                opacity: 1,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              },
            }}
            x1="2"
            x2="22"
            y1="2"
            y2="22"
          />
        </svg>
      </div>
    );
  },
);

WifiOffIcon.displayName = "WifiOffIcon";

export { WifiOffIcon };
