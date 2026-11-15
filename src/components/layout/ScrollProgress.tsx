"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;

    const update = () => {
      const scrolled = window.scrollY;
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? scrolled / total : 0;

      // GPU-composited transform — zero layout cost
      bar.style.transform = `scaleX(${pct})`;

      // Fade in once the user starts scrolling; fade out at 100%
      const opacity = pct <= 0 ? 0 : pct >= 1 ? 0 : 1;
      bar.style.opacity = String(opacity);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // set initial state

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      style={{
        transform: "scaleX(0)",
        transformOrigin: "left",
        opacity: 0,
        transition: "opacity 0.3s ease",
        willChange: "transform",
      }}
      className="pointer-events-none fixed left-0 right-0 top-14 z-[39] h-[2px] bg-accent scroll-progress-bar"
    />
  );
}
