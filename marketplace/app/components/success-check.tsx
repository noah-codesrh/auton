import { useEffect } from "react";

/** Animated blue checkmark drawn on a circle. */
export function SuccessCheck({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="success-pop"
      aria-hidden
    >
      <circle cx="32" cy="32" r="30" fill="#eff6ff" />
      <circle
        className="success-ring"
        cx="32"
        cy="32"
        r="26.5"
        stroke="#2563eb"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <path
        className="success-check"
        d="M20 33.5l8 8 16-18"
        stroke="#2563eb"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Full-screen success overlay that auto-dismisses. */
export function SuccessOverlay({
  open,
  title,
  message,
  onDone,
  duration = 1900,
}: {
  open: boolean;
  title: string;
  message?: string | null;
  onDone: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onDone, duration);
    return () => clearTimeout(id);
  }, [open, duration, onDone]);

  if (!open) return null;

  return (
    <div
      className="success-overlay fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Dismiss"
        onClick={onDone}
      />
      <div className="relative z-10 flex w-full max-w-xs flex-col items-center rounded-2xl border border-black/10 bg-white px-6 py-8 text-center shadow-xl">
        <SuccessCheck />
        <h2 className="pixel-serif mt-4 text-xl text-black">{title}</h2>
        {message && (
          <p className="pixel-sans mt-1 text-sm text-black/55">{message}</p>
        )}
      </div>
    </div>
  );
}
