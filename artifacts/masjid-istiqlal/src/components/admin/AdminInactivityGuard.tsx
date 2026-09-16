import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { removeAuthToken } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const DEFAULT_TIMEOUT_MINUTES = 3;

function normalizeMinutes(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MINUTES;
  return Math.min(10, Math.max(1, Math.round(parsed)));
}

export function AdminInactivityGuard() {
  const [, setLocation] = useLocation();
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_TIMEOUT_MINUTES);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/api/admin/session-settings`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setTimeoutMinutes(normalizeMinutes(data.adminSessionTimeoutMinutes));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let lastActivity = Date.now();
    let loggedOut = false;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const logout = () => {
      if (loggedOut) return;
      loggedOut = true;
      removeAuthToken();
      setLocation("/admin/login");
    };
    const recordActivity = () => {
      lastActivity = Date.now();
    };
    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    const intervalId = window.setInterval(() => {
      if (Date.now() - lastActivity >= timeoutMs) logout();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
    };
  }, [setLocation, timeoutMinutes]);

  return null;
}