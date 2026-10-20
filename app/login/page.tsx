"use client";

import { useState, useEffect } from "react";
import { apiClient, UserProfile, ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@store.dev");
  const [password, setPassword] = useState("AdminPassword123!");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check current session on mount via /api/auth/me
  useEffect(() => {
    checkCurrentSession();
  }, []);

  async function checkCurrentSession() {
    try {
      setLoading(true);
      const res = await apiClient.auth.me();
      setUser(res.data.user);
      setStatusMessage(`Authenticated as ${res.data.user.name} (${res.data.user.role}) via HttpOnly cookie`);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const res = await apiClient.auth.login({ email, password });
      setUser(res.data.user);
      setStatusMessage(`Successfully logged in as ${res.data.user.name} (${res.data.user.role}). Session cookie set.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setErrorMessage(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      await apiClient.auth.logout();
      setUser(null);
      setStatusMessage("Logged out successfully. Authentication cookie has been cleared.");
    } catch (err) {
      setErrorMessage("Logout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Authentication Starter Shell</h1>
        <p className="text-sm text-slate-500 mt-1">
          Example login shell demonstrating API integration with <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">/api/auth/login</code> and HttpOnly cookies.
        </p>
      </div>

      {/* Status or Error Notifications */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md">
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Authenticated State Card */}
      {user ? (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 text-base">{user.name}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {user.role}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded text-xs font-mono text-slate-600">
            <div>ID: {user.id}</div>
            <div>Role: {user.role}</div>
            <div>Session: Verified via Server JWT</div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full py-2 px-4 rounded bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium transition"
          >
            {loading ? "Logging out..." : "Log Out"}
          </button>
        </div>
      ) : (
        /* Login Form Shell */
        <form onSubmit={handleLogin} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@store.dev");
                setPassword("AdminPassword123!");
              }}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
            >
              Fill Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("customer@example.com");
                setPassword("CustomerPassword123!");
              }}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
            >
              Fill Customer
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      )}

      {/* Candidate Guidance */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800">Candidate Implementation Note:</p>
        <p>This is a functional reference implementation. Candidate interns will implement proper registration forms, validation error states, password visibility toggles, and clean UI components.</p>
      </div>
    </div>
  );
}
