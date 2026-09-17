import { useAutonConfig } from "../hooks/use-auton-config";
import { useBackendHealth } from "../hooks/use-backend-health";

export function BackendStatusBadge({
  variant = "dark",
}: {
  variant?: "light" | "dark";
}) {
  const { online, apiUrl } = useBackendHealth();
  const { config } = useAutonConfig();
  const muted = variant === "light" ? "text-black/35" : "text-white/35";
  const mutedSecondary = variant === "light" ? "text-black/30" : "text-white/30";

  if (online === null) {
    return (
      <span className={`pixel-sans text-xs ${muted}`}>Checking API...</span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span
        className={`pixel-sans inline-flex items-center gap-1.5 text-xs ${
          online ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            online ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
        {online ? "API online" : "API offline"}
      </span>
      <span className={`pixel-sans text-xs ${mutedSecondary}`}>{apiUrl}</span>
      {config?.autoTokenMint && (
        <span className={`pixel-sans text-xs ${mutedSecondary}`}>
          $AUTO: {config.autoTokenMint.slice(0, 4)}…
          {config.autoTokenMint.slice(-4)}
        </span>
      )}
    </div>
  );
}
