import { useCallback, useEffect, useState } from "react";

export const KELAS_SESSION_KEY = "kelas_access_granted";
const LAST_ACTIVITY_KEY = "kelas_last_activity";
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

function readStoredAccess() {
  if (typeof window === "undefined" || sessionStorage.getItem(KELAS_SESSION_KEY) !== "true") return false;
  const lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
  if (!Number.isFinite(lastActivity) || Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
    sessionStorage.removeItem(KELAS_SESSION_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    return false;
  }
  return true;
}

export function useKelasAccess() {
  const [accessGranted, setAccessGranted] = useState(readStoredAccess);

  const grantAccess = useCallback(() => {
    sessionStorage.setItem(KELAS_SESSION_KEY, "true");
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    setAccessGranted(true);
  }, []);

  const lock = useCallback(() => {
    sessionStorage.removeItem(KELAS_SESSION_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    setAccessGranted(false);
  }, []);

  useEffect(() => {
    if (!accessGranted) return;

    let timeoutId: number | undefined;
    let lastActivity = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY)) || Date.now();
    const logoutAfterInactivity = () => {
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity);
      if (remaining > 0) {
        timeoutId = window.setTimeout(logoutAfterInactivity, remaining);
        return;
      }
      sessionStorage.removeItem(KELAS_SESSION_KEY);
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);
      setAccessGranted(false);
    };
    const resetInactivityTimer = () => {
      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        logoutAfterInactivity();
        return;
      }
      lastActivity = Date.now();
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivity));
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutAfterInactivity, INACTIVITY_TIMEOUT_MS);
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
  }, [accessGranted]);

  return { accessGranted, grantAccess, lock };
}