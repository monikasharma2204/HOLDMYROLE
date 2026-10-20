"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api/client";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = params;
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await apiClient.products.getById(id);
        const p = res.data;
        setName(p.name);
        setDescription(p.description);
        setPrice(p.price.toString());
        setCategory(p.category);
        setStock(p.stock.toString());
        setImageUrl(p.imageUrl || "");
        setIsActive(p.isActive);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load product details.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSaving(true);

    try {
      await apiClient.products.update(id, {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock, 10),
        imageUrl: imageUrl || null,
        isActive,
      });

      router.push("/admin/products");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(
          err.status === 401
            ? "Authentication required. Please sign in as Administrator."
            : err.status === 403
            ? "Forbidden: Administrator role required to update products."
            : err.message
        );
      } else {
        setErrorMessage("Failed to update product.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-slate-500 font-mono text-sm">
        Loading product details...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Edit Product (Starter Shell)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Form shell updating product via <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">PATCH /api/products/[id]</code>.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Product Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Category
          </label>
          <input
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Price (USD)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Image URL (Optional)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="text-xs text-slate-700 font-medium">
            Active in public catalogue
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin/products"
            className="text-slate-600 hover:text-slate-900 font-semibold text-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition"
          >
            {saving ? "Saving Changes..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
