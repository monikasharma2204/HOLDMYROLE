"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiClient, ProductItem } from "@/lib/api/client";
import Image from "next/image";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt" | "stock">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchProducts = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.products.list({
        page,
        limit: 6,
        search: searchQuery !== undefined ? searchQuery : search,
        category: category || undefined,
        sortBy,
        order,
      });
      setProducts(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load products from API.");
    } finally {
      setLoading(false);
    }
  }, [category, order, page, search, sortBy]);

  // Load categories once
  useEffect(() => {
    apiClient.categories.list().then((res) => {
      setCategories(res.data);
    }).catch(() => {});
  }, []);

  // Fetch products whenever filters or pagination change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchProducts(search);
  }

  return (
    <div className="space-y-6">
      {/* Header and Candidate Callout */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Products Catalogue (Starter Shell)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Demonstration shell fetching dynamic product data from <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">/api/products</code>.
        </p>
      </div>

      {/* Query Filters Shell */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3 items-center justify-between text-xs text-slate-600">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-semibold text-slate-700">Category:</span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-300 rounded bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <span className="font-semibold text-slate-700 ml-2">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 border border-slate-300 rounded bg-white"
            >
              <option value="createdAt">Date Created</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
            </select>

            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as any)}
              className="px-2 py-1 border border-slate-300 rounded bg-white"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="font-mono text-slate-500">
            Total Matching: {pagination.total} (Page {pagination.page} of {pagination.totalPages || 1})
          </div>
        </div>
      </div>

      {/* Product List Representation */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm font-mono">
          Loading products from API...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded border border-slate-200 text-sm">
          No active products match your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:shadow-sm transition"
            >
              <div>
                <Image
                src={product?.imageUrl}
                alt="Product Image"
                width="150"
                height="150"
                className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-indigo-600">{product.category}</span>
                  <span className="bg-green-100 border-green-300 p-2 rounded-2xl">Stock: {product.stock}</span>
                </div>
                <h2 className="font-bold text-slate-900 text-base line-clamp-1">
                  {product.name}
                </h2>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900 font-mono">
                  ${product.price.toFixed(2)}
                </span>
                <Link
                  href={`/products/${product.slug}`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
          className="px-3 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          &larr; Previous Page
        </button>

        <span className="text-slate-500">
          Page {pagination.page} of {pagination.totalPages || 1}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          disabled={page >= pagination.totalPages || loading}
          className="px-3 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          Next Page &rarr;
        </button>
      </div>
    </div>
  );
}
