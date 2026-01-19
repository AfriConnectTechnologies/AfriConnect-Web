"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to ensure user exists and send welcome email for new users.
 * Should be used once in a layout that wraps authenticated pages.
 */
export function useWelcomeEmail(locale: string = "en") {
  const ensureUser = useMutation(api.users.ensureUser);
  const markWelcomeEmailSent = useMutation(api.users.markWelcomeEmailSent);
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const initUser = async () => {
      try {
        const result = await ensureUser();
        
        // Send welcome email if user hasn't received one yet
        if (result?.shouldSendWelcomeEmail && result?.email) {
          fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "welcome",
              to: result.email,
              userName: result.name,
              locale: locale,
            }),
          })
          .then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`API returned ${res.status}: ${text.substring(0, 200)}`);
            }
            const data = await res.json();
            
            // Mark welcome email as sent if successful
            if (data.success) {
              await markWelcomeEmailSent();
            }
          })
          .catch((err) => {
            console.error("Failed to send welcome email:", err);
          });
        }
      } catch (error) {
        console.error("Failed to ensure user:", error);
      }
    };

    initUser();
  }, [ensureUser, markWelcomeEmailSent, locale]);
}
