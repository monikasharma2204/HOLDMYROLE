"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">Checking your session...</p>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Please sign in</h1>
        <p className="text-sm text-slate-500">You need to sign in as an administrator to manage products.</p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
        >
          Go to login
        </Link>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Admins only</h1>
        <p className="text-sm text-slate-500">
          You are signed in as {user.name} ({user.role}). Only administrators can manage products.
        </p>
        <Link
          href="/products"
          className="inline-block px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to products
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
