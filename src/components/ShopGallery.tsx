import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

type Props = {
  images: string[];
  alt: string;
  active: number;
  onChange: (i: number) => void;
  scrollY?: number;
  parallax?: boolean;
};

export function ShopGallery({ images, alt, active, onChange, scrollY = 0, parallax = true }: Props) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--gradient-warm)] text-7xl">🍵</div>
    );
  }

  function handleSwipe(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold = 60;
    if (info.offset.x < -threshold && active < images.length - 1) onChange(active + 1);
    else if (info.offset.x > threshold && active > 0) onChange(active - 1);
  }

  return (
    <>
      <div ref={containerRef} className="relative h-full w-full overflow-hidden touch-pan-y">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={active}
            src={images[active]}
            alt={alt}
            draggable={false}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="h-[120%] w-full select-none object-cover"
            style={parallax ? { transform: `translateY(${Math.min(scrollY * 0.35, 120)}px) scale(1.05)` } : undefined}
            onClick={() => setZoomOpen(true)}
          />
        </AnimatePresence>

        {/* swipe layer (transparent) */}
        <motion.div
          className="absolute inset-0 z-[5]"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleSwipe}
          onTap={() => setZoomOpen(true)}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={(e) => { e.stopPropagation(); active > 0 && onChange(active - 1); }}
              className="absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 backdrop-blur md:flex disabled:opacity-30"
              disabled={active === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={(e) => { e.stopPropagation(); active < images.length - 1 && onChange(active + 1); }}
              className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 backdrop-blur md:flex disabled:opacity-30"
              disabled={active === images.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[10px] font-semibold backdrop-blur">
          <ZoomIn className="h-3 w-3" /> Tap to zoom
        </div>
      </div>

      <AnimatePresence>
        {zoomOpen && (
          <ZoomViewer
            images={images}
            startIndex={active}
            onClose={() => setZoomOpen(false)}
            onIndexChange={onChange}
            alt={alt}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ZoomViewer({
  images,
  startIndex,
  onClose,
  onIndexChange,
  alt,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  alt: string;
}) {
  const [idx, setIdx] = useState(startIndex);
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const lastTapRef = useRef(0);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  function reset() {
    animate(scale, 1, { duration: 0.25 });
    animate(x, 0, { duration: 0.25 });
    animate(y, 0, { duration: 0.25 });
  }

  function go(next: number) {
    if (next < 0 || next >= images.length) return;
    setIdx(next);
    onIndexChange(next);
    scale.set(1); x.set(0); y.set(0);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      pinchRef.current = { startDist: dist, startScale: scale.get() };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const ns = Math.max(1, Math.min(4, pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
      scale.set(ns);
    }
  }
  function onTouchEnd() {
    pinchRef.current = null;
    if (scale.get() < 1.05) reset();
  }

  function onTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      // double tap
      if (scale.get() > 1) reset();
      else animate(scale, 2, { duration: 0.25 });
    }
    lastTapRef.current = now;
  }

  function onSwipe(_e: any, info: PanInfo) {
    if (scale.get() > 1.05) return; // panning while zoomed
    if (info.offset.x < -80) go(idx + 1);
    else if (info.offset.x > 80) go(idx - 1);
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
        {idx + 1} / {images.length}
      </div>

      <motion.img
        src={images[idx]}
        alt={alt}
        draggable={false}
        style={{ scale, x, y }}
        drag
        dragMomentum={false}
        onDragEnd={onSwipe}
        onClick={onTap}
        className="max-h-[90vh] max-w-full select-none object-contain"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => go(idx - 1)}
            disabled={idx === 0}
            className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur md:flex disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(idx + 1)}
            disabled={idx === images.length - 1}
            className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur md:flex disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wide text-white/70">
        Pinch • Double-tap • Swipe
      </p>
    </motion.div>
  );
}
