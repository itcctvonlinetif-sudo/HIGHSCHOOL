import { useCallback, useEffect, useState } from "react";

export const KELAS_SESSION_KEY = "kelas_access_granted";
const LAST_ACTIVITY_KEY = "kelas_last_activity";
const TIMEOUT_MINUTES_KEY = "kelas_access_timeout_minutes";
const DEFAULT_TIMEOUT_MINUTES = 3;

function normalizeTimeoutMinutes(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MINUTES;
  return Math.min(10, Math.max(1, Math.round(parsed)));
}

function readStoredTimeoutMinutes() {
  if (typeof window === "undefined") return DEFAULT_TIMEOUT_MINUTES;
  return normalizeTimeoutMinutes(sessionStorage.getItem(TIMEOUT_MINUTES_KEY));
}

function readStoredAccess() {
  if (typeof window === "undefined" || sessionStorage.getItem(KELAS_SESSION_KEY) !== "true") return false;
  const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
  const timeoutMs = readStoredTimeoutMinutes() * 60 * 1000;
  if (!Number.isFinite(lastActivity) || Date.now() - lastActivity >= timeoutMs) {
    sessionStorage.removeItem(KELAS_SESSION_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(TIMEOUT_MINUTES_KEY);
    return false;
  }
  return true;
}

export function useKelasAccess(configuredTimeoutMinutes?: number) {
  const timeoutMinutes = normalizeTimeoutMinutes(configuredTimeoutMinutes ?? readStoredTimeoutMinutes());
  const inactivityTimeoutMs = timeoutMinutes * 60 * 1000;
  const [accessGranted, setAccessGranted] = useState(readStoredAccess);

  const grantAccess = useCallback(() => {
    sessionStorage.setItem(KELAS_SESSION_KEY, "true");
    sessionStorage.setItem(TIMEOUT_MINUTES_KEY, String(timeoutMinutes));
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    setAccessGranted(true);
  }, [timeoutMinutes]);

  const lock = useCallback(() => {
    sessionStorage.removeItem(KELAS_SESSION_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(TIMEOUT_MINUTES_KEY);
    setAccessGranted(false);
  }, []);

  useEffect(() => {
    if (!accessGranted) return;

    let timeoutId: number | undefined;
    let lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY)) || Date.now();
    sessionStorage.setItem(TIMEOUT_MINUTES_KEY, String(timeoutMinutes));
    const logoutAfterInactivity = () => {
      const remaining = inactivityTimeoutMs - (Date.now() - lastActivity);
      if (remaining > 0) {
        timeoutId = window.setTimeout(logoutAfterInactivity, remaining);
        return;
      }
      sessionStorage.removeItem(KELAS_SESSION_KEY);
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);
      sessionStorage.removeItem(TIMEOUT_MINUTES_KEY);
      setAccessGranted(false);
    };
    const resetInactivityTimer = () => {
      if (Date.now() - lastActivity >= inactivityTimeoutMs) {
        logoutAfterInactivity();
        return;
      }
      lastActivity = Date.now();
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivity));
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutAfterInactivity, inactivityTimeoutMs);
    };
    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
      "mousemove",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer();

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [accessGranted, inactivityTimeoutMs, timeoutMinutes]);

  return { accessGranted, grantAccess, lock };
}