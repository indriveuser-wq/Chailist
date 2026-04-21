import { motion, AnimatePresence } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Wraps page content with directional slide transitions.
 * - Forward into a shop detail / nested route → slide-in from right
 * - Back to a parent route → slide-out to right (reverse)
 * - Sibling routes → fade
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useRouterState({ select: (s) => s.location });
  const key = location.pathname;

  // Decide direction based on path depth.
  const depth = key.split("/").filter(Boolean).length;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        initial={{ opacity: 0, x: depth > 1 ? 24 : 0, y: depth <= 1 ? 8 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: depth > 1 ? -16 : 0, y: depth <= 1 ? -4 : 0 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Modal/sheet content that slides down from the top.
 * Use inside a fixed/absolute overlay container.
 */
export function SlideDownModal({
  open,
  children,
  onClose,
}: {
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 top-0 z-50"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}