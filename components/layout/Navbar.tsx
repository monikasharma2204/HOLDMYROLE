"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/login", label: "Login Demo" },
    { href: "/products", label: "Products Catalogue" },
    { href: "/admin/products", label: "Admin Products" },
  ];


  const visibleLinks = navLinks.filter(
    (link) => link.href !== "/admin/products" || user?.role === "ADMIN"
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              EC
            </span>
            <span>E-Commerce Assessment Shell</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Intern Starter Shell
          </span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {!loading && user && (
            <div className="flex items-center gap-2 pl-2 text-sm">
              <span className="text-slate-700">{user.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                {user.role}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
