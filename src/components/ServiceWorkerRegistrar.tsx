"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
      } catch (error) {
        console.error("sw-register-failed", error);
      }
    };
    register();
  }, []);
  return null;
}

