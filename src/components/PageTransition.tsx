import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Pass-through wrapper. We intentionally do NOT key on pathname here:
 * keying the wrapper caused the whole subtree to remount on every
 * navigation, which produced a visible "refresh / blank flash" before
 * the new route appeared. TanStack Router already handles per-route
 * mount/unmount; let it do its job and avoid forcing a top-level remount.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <>{children}</>;
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