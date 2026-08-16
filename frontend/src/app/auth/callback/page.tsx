"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { googleCodeLogin } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const authError = params.get("error");

    if (authError) {
      setError(`Google sign-in was denied: ${authError}`);
      return;
    }

    if (!code) {
      setError("No authorization code received from Google.");
      return;
    }

    googleCodeLogin(code)
      .then(() => router.push("/dashboard"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      });
  }, [googleCodeLogin, router]);

  if (error) {
    return (
      <div className="auth-page bg-dot-grid bg-[var(--bg-void)]">
        <div className="auth-card glass-panel premium-glow" style={{ maxWidth: 420, textAlign: "center" }}>
          <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>
          <a href="/login" className="auth-submit inline-block font-semibold text-sm py-3 px-6" style={{ textDecoration: "none" }}>
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page bg-dot-grid bg-[var(--bg-void)]">
      <div className="loading-screen" style={{ minHeight: "100vh" }}>
        <div className="loading-spinner" />
        <p className="loading-text">Completing Google sign-in...</p>
      </div>
    </div>
  );
}
