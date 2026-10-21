"use client";

import { useState, useEffect } from "react";
import { apiClient, UserProfile, ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { Eye, EyeClosed, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("admin@store.dev");
  const [password, setPassword] = useState("AdminPassword123!");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean | false>(false);

  function handleShowPassword() {
    setShowPassword(!showPassword);
  }
  // Check current session on mount via /api/auth/me
  useEffect(() => {
    checkCurrentSession();
  }, []);

  async function checkCurrentSession() {
    try {
      setLoading(true);
      const res = await apiClient.auth.me();
      setUser(res.data.user);
      setStatusMessage(
        `Authenticated as ${res.data.user.name} (${res.data.user.role}) via HttpOnly cookie`,
      );
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
      console.log(res);
      await refreshUser();
      setStatusMessage(
        `Successfully logged in as ${res.data.user.name} (${res.data.user.role})`,
      );
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
      await refreshUser();
      setStatusMessage(
        "Logged out successfully. Authentication cookie has been cleared.",
      );
    } catch (err) {
      setErrorMessage("Logout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Login</h1>
        <p className="text-sm text-slate-500 mt-1">Sign-in to you account</p>
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
              <h2 className="font-semibold text-slate-900 text-base">
                {user.name}
              </h2>
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
            style={{
              backgroundColor: "#e2a731",

              color: "#ffffff",
            }}
            className="py-2.5 w-full text-white font-semibold rounded-lg focus:ring-4 focus:outline-none transition-all duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging out..." : "Log Out"}
          </button>
        </div>
      ) : (
        /* Login Form Shell */
        <form
          onSubmit={handleLogin}
          className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4"
        >
          <div>
            <label
              className="text-sm font-medium"
              style={{
                fontFamily: "Nunito, Roboto, Inter, sans-serif",
                color: "#292929",
              }}
            >
              Email
            </label>
            <div className="relative mt-1">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: "#78dcca" }}
              />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="pl-10 pr-4 py-2 w-full border-[#78dcca] border rounded-lg focus:ring-2 focus:border-transparent text-sm transition-all duration-200 ease-in-out"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#292929]">
              Password
            </label>
            <div className="relative mt-1">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: "#78dcca" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-10 pr-10 py-2 border-[#78dcca] w-full border rounded-lg focus:ring-2 focus:border-transparent text-sm transition-all duration-200 ease-in-out"
                required
              />
              {showPassword ? (
                <Eye
                  onClick={handleShowPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 cursor-pointer hover:text-yellow-600 transition-colors"
                  style={{ color: "#78dcca" }}
                />
              ) : (
                <EyeClosed
                  onClick={handleShowPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 cursor-pointer hover:text-yellow-600 transition-colors"
                  style={{ color: "#78dcca" }}
                />
              )}
            </div>
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
            style={{
              backgroundColor: "#e2a731",

              color: "#ffffff",
            }}
            className="py-2.5 w-full text-white font-semibold rounded-lg focus:ring-4 focus:outline-none transition-all duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      )}
    </div>
  );
}
