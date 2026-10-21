"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, ProductItem, ApiError } from "@/lib/api/client";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.products.list({ limit: 50, sortBy: "createdAt", order: "desc" });
      setProducts(res.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!productToDelete) return;

    const product = productToDelete;
    setDeleting(true);
    setErrorMessage(null);
    setActionMessage(null);

    try {
      await apiClient.products.delete(product.id);
  
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setActionMessage(`"${product.name}" was deleted.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(
          err.status === 401
            ? "Your session has ended. Please sign in again."
            : err.status === 403
            ? "Forbidden: only administrators can delete products."
            : err.message
        );
      } else {
        setErrorMessage("Failed to delete the product.");
      }
    } finally {
      setDeleting(false);
      setProductToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Products</h1>
          <p className="text-sm text-slate-500 mt-1">Add, edit or delete the products in the store.</p>
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
        <div className="p-8 text-center text-slate-500 text-sm min-h-[300px]">Loading products...</div>
      ) : loadError ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-lg">
          <p className="font-semibold text-rose-800">Could not load products</p>
          <p className="text-sm text-rose-700 mt-1">{loadError}</p>
          <button
            onClick={loadProducts}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-lg">
          <p className="font-semibold text-slate-900">No products yet</p>
          <p className="text-sm text-slate-500 mt-1">Add your first product to get started.</p>
          <Link
            href="/admin/products/new"
            className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded"
          >
            + Add New Product
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900">
                    <div>{p.name}</div>
                    <div className="text-slate-400 font-mono text-xs">{p.slug}</div>
                  </td>
                  <td className="p-3 text-slate-600">{p.category}</td>
                  <td className="p-3 font-semibold text-slate-800">${p.price.toFixed(2)}</td>
                  <td
                    className={`p-3 ${
                      p.stock === 0
                        ? "text-red-600 font-semibold"
                        : p.stock <= 20
                        ? "text-amber-600 font-semibold"
                        : "text-slate-600"
                    }`}
                  >
                    {p.stock}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-3 whitespace-nowrap">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 font-semibold"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setProductToDelete(p)}
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

     
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-lg p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Delete this product?</h2>
            <p className="text-sm text-slate-600">
              &quot;{productToDelete.name}&quot; will be removed from the store. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-sm font-medium disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
