"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
// import Link from "next/link";
import { apiClient, ProductItem } from "@/lib/api/client";
import { ProductCard } from "@/components/products/ProductCard";
// import Image from "next/image";

import { useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 6;

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchText, setSearchText] = useState(searchParams.get("search") || ""); // what is typed in the box
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt" | "stock">(
    (searchParams.get("sortBy") as "name" | "price" | "createdAt") || "createdAt"
  );
  const [order, setOrder] = useState<"asc" | "desc">(
    (searchParams.get("order") as "asc" | "desc") || "desc"
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.products.list({
        page,
        limit: PAGE_SIZE,
        search,
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

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (sortBy !== "createdAt" || order !== "desc") {
      params.set("sortBy", sortBy);
      params.set("order", order);
    }
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    const url = query ? `/products?${query}` : "/products";

  
    try {
      sessionStorage.setItem("catalogueUrl", url);
    } catch {
  
    }

    router.replace(url);
  }, [search, category, sortBy, order, page, router]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
  const choice = e.target.value;

  if (choice === "price-asc") {
    setSortBy("price");
    setOrder("asc");
  }
  if (choice === "price-desc") {
    setSortBy("price");
    setOrder("desc");
  }
  if (choice === "createdAt-desc") {
    setSortBy("createdAt");
    setOrder("desc");
  }
  if (choice === "name-asc") {
    setSortBy("name");
    setOrder("asc");
  }

  setPage(1);
}

function clearFilters() {
  setSearch("");
  setSearchText("");
  setCategory("");
  setSortBy("createdAt");
  setOrder("desc");
  setPage(1);
}

const hasFilters = search !== "" || category !== "" || sortBy !== "createdAt" || order !== "desc";

const firstItem = (pagination.page - 1) * pagination.limit + 1;
const lastItem = firstItem + products.length - 1;

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
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
  value={`${sortBy}-${order}`}
  onChange={handleSortChange}
  className="px-2 py-1 border border-slate-300 rounded bg-white"
>
  <option value="createdAt-desc">Newest</option>
  <option value="price-asc">Price: Low to High</option>
  <option value="price-desc">Price: High to Low</option>
  <option value="name-asc">Name (A-Z)</option>
</select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            )}
          </div>

        <p className="text-sm text-slate-600">
  {pagination.total === 0
    ? "No products found"
    : `Showing ${firstItem}-${lastItem} of ${pagination.total} products`}
</p>
        </div>
      </div>

      {/* Product List Representation */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm min-h-[400px]">
          Loading products...
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-lg">
          <p className="font-semibold text-rose-800">Could not load products</p>
          <p className="text-sm text-rose-700 mt-1">{error}</p>
          <button
            onClick={() => fetchProducts()}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-lg">
          <p className="font-semibold text-slate-900">No products match your search</p>
          <p className="text-sm text-slate-500 mt-1">Try a different search word or category.</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {products.map((product) => (
    <ProductCard key={product.id} product={product} />
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

// useSearchParams needs a Suspense wrapper, otherwise "next build" fails
export default function ProductsPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ProductsContent />
    </Suspense>
  );
}
