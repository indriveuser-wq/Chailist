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

  // Subtle fade-in only — never unmount the previous tree (keeps scroll,
  // form state, and avoids the "page refresh" blank flash between routes).
  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
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