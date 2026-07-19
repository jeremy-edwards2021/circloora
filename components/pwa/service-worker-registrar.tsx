"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // The offline shell is an enhancement. A registration failure never blocks local records.
      });
  }, []);

  return null;
}
