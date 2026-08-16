"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.accounts?.id) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google?.accounts?.id;
    if (!g || !googleBtnRef.current) return;
    g.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response: { credential?: string }) => {
        try {
          if (response.credential) await googleLogin(response.credential);
          router.push("/dashboard");
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Google login failed");
        }
      },
    });
    g.renderButton(googleBtnRef.current, {
      type: "icon",
      shape: "circle",
      size: "large",
    });
    initializedRef.current = true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    const btn = googleBtnRef.current?.querySelector('[role="button"]') as HTMLElement | null;
    if (btn) {
      btn.click();
    } else if (!initializedRef.current) {
      setError("Google Sign-In not loaded. Try email login.");
    }
  }

  return (
    <div className="auth-page bg-dot-grid bg-[var(--bg-void)]">
      <div className="auth-card glass-panel premium-glow">
        <Link href="/" className="auth-title font-display block text-center mb-2 leading-none text-2xl font-extrabold text-white">
          Scout<span className="text-gradient-orange">Mind</span>
        </Link>
        <p className="auth-subtitle text-[var(--text-secondary)] text-center text-xs mb-8">
          Access your startup validation workspace
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-xs leading-normal font-medium bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] text-[var(--color-error)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              autoFocus
            />
          </div>
          <div className="auth-field mb-6">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input text-sm"
              required
              minLength={8}
            />
          </div>
          
          <button type="submit" className="auth-submit font-semibold text-sm py-3 w-full" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In to Workspace"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button onClick={handleGoogle} className="auth-google text-sm font-semibold py-2.5 w-full" disabled={loading}>
          <svg viewBox="0 0 24 24" width="18" height="18" className="mr-1">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <div ref={googleBtnRef} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />

        <p className="auth-footer text-xs mt-6 text-[var(--text-secondary)]">
          Don&apos;t have an account? <Link href="/register" className="font-semibold">Create one</Link>
        </p>
      </div>
    </div>
  );
}
