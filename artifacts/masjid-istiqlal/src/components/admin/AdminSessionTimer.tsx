import { useCallback, useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const DEFAULT_MINUTES = 3;

function normalizeMinutes(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MINUTES;
  return Math.min(10, Math.max(1, Math.round(parsed)));
}

function formatTime(totalSeconds: number) {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function AdminSessionTimer({ variant = "header" }: { variant?: "header" | "sidebar" }) {
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_MINUTES);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_MINUTES * 60);

  const loadDuration = useCallback(() => {
    fetch(`${BASE}/api/admin/classes-access`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        const minutes = normalizeMinutes(data.accessTimeoutMinutes);
        setDurationMinutes(minutes);
        setRemainingSeconds(minutes * 60);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadDuration();
    window.addEventListener("kelas-access-settings-updated", loadDuration);
    return () => window.removeEventListener("kelas-access-settings-updated", loadDuration);
  }, [loadDuration]);

  useEffect(() => {
    const resetTimer = () => setRemainingSeconds(durationMinutes * 60);
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [durationMinutes]);

  return (
    <div className={`flex items-center gap-1.5 text-xs ${variant === "sidebar" ? "text-primary-foreground/65" : "text-primary/65"}`}>
      <Clock3 size={13} />
      <span>Sesi Kelas</span>
      <span className="font-bold tabular-nums">{formatTime(remainingSeconds)}</span>
    </div>
  );
}