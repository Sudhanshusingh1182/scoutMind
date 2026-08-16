"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void; auto_select?: boolean }) => void;
          renderButton: (parent: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleCallback = useCallback(async (response: { credential?: string }) => {
    try {
      if (response.credential) await googleLogin(response.credential);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
    }
  }, [googleLogin, router]);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initGoogle() {
    if (initializedRef.current) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    if (!clientId) {
      setError("Google Sign-In is not configured.");
      return;
    }

    window.google?.accounts?.id?.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
    });

    if (googleBtnRef.current) {
      window.google?.accounts?.id?.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: googleBtnRef.current.offsetWidth || 300,
      });
    }

    initializedRef.current = true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page bg-dot-grid bg-[var(--bg-void)]">
      <div className="auth-card glass-panel premium-glow">
        <Link href="/" className="auth-title font-display block text-center mb-2 leading-none text-2xl font-extrabold text-white">
          Scout<span className="text-gradient-orange">Mind</span>
        </Link>
        <p className="auth-subtitle text-[var(--text-secondary)] text-center text-xs mb-8">
          Start validating your project ideas with autonomous agents
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-xs leading-normal font-medium bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] text-[var(--color-error)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elon Musk"
              className="auth-input text-sm"
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input text-sm"
              required
            />
          </div>
          <div className="auth-field mb-6">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="auth-input text-sm"
              required
              minLength={8}
            />
          </div>
          
          <button type="submit" className="auth-submit font-semibold text-sm py-3 w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Create Free Account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div ref={googleBtnRef} className="w-full flex justify-center google-btn-container" />

        <p className="auth-footer text-xs mt-6 text-[var(--text-secondary)]">
          Already have an account? <Link href="/login" className="font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
