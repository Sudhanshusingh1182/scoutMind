"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ScoutMindLogo from "./scoutmind-logo";

export default function Header() {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="header glass-panel">
      <Link href="/" className="header-logo">
        <ScoutMindLogo size={32} />
        <span>Scout<span className="text-gradient-orange">Mind</span></span>
      </Link>
      <nav className="header-nav">
        {user ? (
          <>
            <Link href="/dashboard" className="header-link hover:text-white transition-colors duration-200">
              Workspace
            </Link>
            <div className="flex items-center gap-3 pl-2 border-l border-[var(--border-subtle)]">
              <div 
                className="w-7 h-7 rounded-full bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.2)] text-[var(--brand-orange)] flex items-center justify-center text-xs font-bold font-display"
                title={user.name}
              >
                {getInitials(user.name)}
              </div>
              <span className="header-user-name hidden sm:inline">{user.name}</span>
            </div>
            <button onClick={logout} className="header-btn header-btn-ghost">
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="header-btn header-btn-ghost">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}

