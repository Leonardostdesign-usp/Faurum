import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedVisitorId = null;

export function useFingerprint() {
  const [visitorId, setVisitorId] = useState(cachedVisitorId || "");

  useEffect(() => {
    if (cachedVisitorId) {
      setVisitorId(cachedVisitorId);
      return;
    }

    let isMounted = true;
    FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => {
        if (isMounted && result.visitorId) {
          cachedVisitorId = result.visitorId;
          setVisitorId(result.visitorId);
        }
      })
      .catch(() => {
        // Fallback discreto em caso de bloqueio por adblocker
        if (isMounted) {
          const fallbackId = `fp_${Math.random().toString(36).substring(2, 12)}`;
          cachedVisitorId = fallbackId;
          setVisitorId(fallbackId);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return visitorId;
}
