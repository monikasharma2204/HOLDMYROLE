import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/lib/auth/AuthContext";

export const metadata: Metadata = {
  title: "E-Commerce API & Assessment Starter",
  description: "Assessment starter repository for Next.js frontend interns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-y-scroll">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 text-center font-mono">
            🚀 Intern Frontend Assessment Environment &middot; Backend Route Handlers &amp; Database Connected
          </div>
          <Navbar />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            E-Commerce Assessment Starter &middot; Built with Next.js App Router, Prisma ORM, and PostgreSQL.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
