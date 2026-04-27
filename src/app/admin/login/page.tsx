"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Login failed");
      }
      router.replace(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <form className="login-card" onSubmit={submit}>
        <h1>Doris admin</h1>
        <p>Enter the admin password to edit the site.</p>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </label>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <style>{`
        .login-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f8fc; font-family: Inter, system-ui, sans-serif; color: #17304a; padding: 24px; }
        .login-card { width: 100%; max-width: 380px; background: white; border: 1px solid #dbe9f3; border-radius: 10px; padding: 40px 32px; display: flex; flex-direction: column; gap: 18px; box-shadow: 0 4px 24px rgba(23, 48, 74, 0.08); }
        .login-card h1 { margin: 0; font-family: var(--font-playfair, Playfair Display), serif; font-size: 24px; font-weight: 700; color: #17304a; }
        .login-card > p { margin: 0; color: #2e5f85; font-size: 14px; }
        .login-card label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #2e5f85; font-weight: 600; }
        .login-card input { padding: 12px; border: 1px solid #dbe9f3; border-radius: 6px; background: #f5f8fc; font-family: inherit; font-size: 15px; color: #17304a; }
        .login-card input:focus { outline: none; border-color: #D97706; background: white; }
        .login-error { font-size: 13px; color: #b45309; background: #fef3c7; padding: 10px 12px; border-radius: 6px; }
        .login-card button { padding: 13px; background: #17304a; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; letter-spacing: 0.04em; }
        .login-card button:hover:not(:disabled) { background: #D97706; }
        .login-card button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
