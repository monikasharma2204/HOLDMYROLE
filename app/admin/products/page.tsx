"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, ProductItem, ApiError } from "@/lib/api/client";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await apiClient.products.list({ limit: 50, sortBy: "createdAt", order: "desc" });
      setProducts(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setErrorMessage(null);
    setActionMessage(null);

    try {
      await apiClient.products.delete(id);
      setActionMessage(`Product "${name}" was deleted successfully.`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(
          err.status === 401
            ? "Authentication required. Please sign in as Administrator."
            : err.status === 403
            ? "Forbidden: You must be logged in as an ADMIN to delete products."
            : err.message
        );
      } else {
        setErrorMessage("Failed to delete product.");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Products Management (Starter Shell)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administrative inventory shell demonstrating authenticated API operations (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">POST/PATCH/DELETE /api/products</code>).
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition"
        >
          + Add New Product
        </Link>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded">
          {actionMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-mono text-sm">
          Loading inventory...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900">
                    <div>{p.name}</div>
                    <div className="text-slate-400 font-mono text-[10px]">{p.slug}</div>
                  </td>
                  <td className="p-3 text-slate-600">{p.category}</td>
                  <td className="p-3 font-mono font-semibold text-slate-800">${p.price.toFixed(2)}</td>
                  <td className="p-3 text-slate-600">{p.stock}</td>
                  <td className="p-3 text-right space-x-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 font-semibold"
                    >
                      Edit
                    </Link>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-rose-600 hover:text-rose-900 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
