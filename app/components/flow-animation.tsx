import { useEffect, useRef, type ReactNode } from "react";

type Point = { x: number; y: number };

type AnimatedDotProps = {
  from: Point;
  to: Point;
  delay: number;
  duration: number;
  repeatDelay: number;
};

function AnimatedDot({ from, to, delay, duration, repeatDelay }: AnimatedDotProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const cycle = (duration + repeatDelay) * 1000;
    const delayMs = delay * 1000;
    const durationMs = duration * 1000;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) % cycle;
      const active = elapsed >= delayMs && elapsed < delayMs + durationMs;

      if (active) {
        const t = (elapsed - delayMs) / durationMs;
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t;
        const opacity = t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.opacity = String(opacity);
      } else {
        el.style.opacity = "0";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from.x, from.y, to.x, to.y, delay, duration, repeatDelay]);

  return (
    <div
      ref={ref}
      className="absolute h-2 w-2 bg-white"
      style={{ left: -4, top: -4, opacity: 0 }}
    />
  );
}

type PulseBoxProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
  repeatDelay: number;
};

function PulseBox({ left, top, width, height, delay, duration, repeatDelay }: PulseBoxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const cycle = (duration + repeatDelay) * 1000;
    const delayMs = delay * 1000;
    const durationMs = duration * 1000;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) % cycle;
      const active = elapsed >= delayMs && elapsed < delayMs + durationMs;

      if (active) {
        const t = (elapsed - delayMs) / durationMs;
        const opacity = t < 0.05 ? t / 0.05 : t > 0.95 ? (1 - t) / 0.05 : 1;
        el.style.opacity = String(opacity);
      } else {
        el.style.opacity = "0";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [delay, duration, repeatDelay]);

  return (
    <div
      ref={ref}
      className="absolute border border-white/50"
      style={{ left, top, width, height, opacity: 0 }}
    />
  );
}

type FlowPathProps = {
  user: Point;
  worker: Point;
  centerX: number;
  centerY: number;
  totalDuration: number;
  startDelay?: number;
};

function FlowPath({
  user,
  worker,
  centerX,
  centerY,
  totalDuration,
  startDelay = 0,
}: FlowPathProps) {
  const repeatDelay = totalDuration - 1;

  return (
    <>
      <AnimatedDot
        from={{ x: user.x + 10, y: user.y }}
        to={{ x: centerX, y: centerY }}
        delay={startDelay}
        duration={1}
        repeatDelay={repeatDelay}
      />
      <AnimatedDot
        from={{ x: centerX, y: centerY }}
        to={{ x: worker.x - 12, y: worker.y }}
        delay={startDelay + 1.2}
        duration={1}
        repeatDelay={repeatDelay}
      />
      <AnimatedDot
        from={{ x: worker.x - 12, y: worker.y }}
        to={{ x: centerX, y: centerY }}
        delay={startDelay + 2.8}
        duration={1}
        repeatDelay={repeatDelay}
      />
      <AnimatedDot
        from={{ x: centerX, y: centerY }}
        to={{ x: user.x + 10, y: user.y }}
        delay={startDelay + 4}
        duration={1}
        repeatDelay={repeatDelay}
      />
      <PulseBox
        left={user.x - 13}
        top={user.y - 13}
        width={24}
        height={24}
        delay={startDelay}
        duration={5.5}
        repeatDelay={totalDuration - 5.5}
      />
      <PulseBox
        left={worker.x - 15}
        top={worker.y - 14}
        width={28}
        height={28}
        delay={startDelay + 1.5}
        duration={2.5}
        repeatDelay={totalDuration - 2.5}
      />
    </>
  );
}

function PulsingCenter({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const duration = 3000;
    const start = performance.now();

    const tick = (now: number) => {
      const t = ((now - start) % duration) / duration;
      const scale = 1 + 0.03 * Math.sin(t * Math.PI * 2);
      el.style.transform = `scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} className="absolute text-white" style={{ left: 144, top: 64 }}>
      {children}
    </div>
  );
}

export { FlowPath, PulsingCenter };
