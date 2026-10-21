"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api/client";
import { validateProduct, ProductFormErrors } from "@/lib/utils/validateProduct";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const formErrors = validateProduct({ name, description, price, category, stock, imageUrl });
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await apiClient.products.create({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        category: category.trim(),
        stock: Number(stock),
        imageUrl: imageUrl.trim() || null,
        isActive,
      });

      
      
      setSuccessMessage("Product created. Going back to the list...");
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (err) {
      if (err instanceof ApiError) {
      
        if (err.status === 400 && err.details) {
          const serverErrors: ProductFormErrors = {};
          for (const field in err.details) {
            serverErrors[field as keyof ProductFormErrors] = err.details[field][0];
          }
          setErrors(serverErrors);
        }
        setErrorMessage(
          err.status === 401
            ? "Your session has ended. Please sign in again."
            : err.status === 403
            ? "Forbidden: only administrators can create products."
            : err.message
        );
      } else {
        setErrorMessage("Failed to create the product.");
      }
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
        <p className="text-sm text-slate-500 mt-1">Fill in the details and save to add it to the store.</p>
      </div>

      {successMessage && (
        <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded">
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 text-sm"
      >
        <div>
          <label htmlFor="name" className="block font-semibold text-slate-700 mb-1">
            Product Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Ergonomic Office Chair"
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block font-semibold text-slate-700 mb-1">
            Category
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-invalid={!!errors.category}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Furniture, Audio, Electronics"
          />
          {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block font-semibold text-slate-700 mb-1">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={!!errors.price}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.price && <p className="text-xs text-rose-600 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="stock" className="block font-semibold text-slate-700 mb-1">
              Stock Quantity
            </label>
            <input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              aria-invalid={!!errors.stock}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.stock && <p className="text-xs text-rose-600 mt-1">{errors.stock}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="imageUrl" className="block font-semibold text-slate-700 mb-1">
            Image URL (optional)
          </label>
          <input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            aria-invalid={!!errors.imageUrl}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://example.com/image.jpg"
          />
          {errors.imageUrl && <p className="text-xs text-rose-600 mt-1">{errors.imageUrl}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errors.description}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Detailed product specifications and features..."
          />
          {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="text-slate-700 font-medium">
            Active in public catalogue
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link href="/admin/products" className="text-slate-600 hover:text-slate-900 font-semibold">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
