import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import slideChai from "@/assets/slide-chai.jpg";
import slideStall from "@/assets/slide-stall.jpg";
import slideScenic from "@/assets/slide-scenic.jpg";
import slideCafe from "@/assets/slide-cafe.jpg";

const SLIDES = [
  { src: slideChai, eyebrow: "Steaming hot", title: "Find your perfect cup" },
  { src: slideStall, eyebrow: "Street favorites", title: "Iconic chai stalls nearby" },
  { src: slideScenic, eyebrow: "Scenic escapes", title: "Tea with a view" },
  { src: slideCafe, eyebrow: "Cozy cafes", title: "Warm corners to unwind" },
];

const INTERVAL = 4500;

export function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused]);

  function go(next: number) {
    setI(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }

  function onDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -60) go(i + 1);
    else if (info.offset.x > 60) go(i - 1);
  }

  const s = SLIDES[i];

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-3xl bg-muted shadow-[var(--shadow-elevated)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.img
          key={i}
          src={s.src}
          alt={s.title}
          draggable={false}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1.02 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
      </AnimatePresence>

      {/* Drag layer */}
      <motion.div
        className="absolute inset-0 z-[5]"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={onDragEnd}
      />

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              {s.eyebrow}
            </p>
            <h2 className="mt-1 font-display text-lg font-extrabold leading-tight text-white drop-shadow sm:text-2xl">
              {s.title}
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => go(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-6 bg-white" : "w-1.5 bg-white/55"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
