import { useEffect, useRef } from "react";

const BLOBS = [
  { x: 0.12, y: 0.45, r: 0.28 },
  { x: 0.88, y: 0.38, r: 0.32 },
  { x: 0.72, y: 0.12, r: 0.18 },
  { x: 0.35, y: 0.78, r: 0.15 },
];

function densityAt(x: number, y: number) {
  let d = 0;
  for (const blob of BLOBS) {
    const dx = x - blob.x;
    const dy = y - blob.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < blob.r) {
      d += (1 - dist / blob.r) ** 2;
    }
  }
  return Math.min(d, 1);
}

export type PixelBackgroundVariant = "clustered" | "fine";
export type PixelBackgroundTheme = "light" | "dark";

export function PixelBackground({
  variant = "clustered",
  theme = "light",
}: {
  variant?: PixelBackgroundVariant;
  theme?: PixelBackgroundTheme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const isDark = theme === "dark";
    const bg = isDark ? "#000000" : "#ffffff";
    const dot = isDark ? "255,255,255" : "0,0,0";

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      if (variant === "fine") {
        const spacing = 10;
        const cols = Math.ceil(w / spacing);
        const rows = Math.ceil(h / spacing);

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const hash = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
            const rand = hash - Math.floor(hash);
            if (rand > 0.38) continue;

            const alpha = 0.05 + rand * 0.12;
            ctx.fillStyle = `rgba(${dot},${alpha})`;
            ctx.fillRect(col * spacing + 1, row * spacing + 1, 1, 1);
          }
        }
        return;
      }

      const spacing = 5;
      const cols = Math.ceil(w / spacing);
      const rows = Math.ceil(h / spacing);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = col / cols;
          const ny = row / rows;
          const d = densityAt(nx, ny);
          if (d < 0.08) continue;

          const threshold = 0.08 + d * 0.55;
          const hash = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
          const rand = hash - Math.floor(hash);

          if (rand < threshold) {
            const alpha = isDark ? 0.08 + d * 0.42 : 0.12 + d * 0.5;
            ctx.fillStyle = `rgba(${dot},${alpha})`;
            ctx.fillRect(col * spacing, row * spacing, 1.5, 1.5);
          }
        }
      }
    };

    const render = () => {
      resize();
      draw();
    };

    render();
    window.addEventListener("resize", render);

    return () => {
      window.removeEventListener("resize", render);
    };
  }, [variant, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
