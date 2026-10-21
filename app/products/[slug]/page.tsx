import { notFound } from "next/navigation";
import BackToCatalogue from "@/components/products/BackToCatalogue";
import ProductImage from "@/components/products/ProductImage";
import type { ProductItem } from "@/lib/api/client";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = params;

  // Get the product from the slug API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/products/slug/${slug}`, { cache: "no-store" });


if (res.status === 404 || res.status === 400) {
    notFound();
  }
  if (!res.ok) {
    throw new Error("Could not load the product");
  }

  const { data: product }: { data: ProductItem } = await res.json();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <BackToCatalogue className="hover:text-indigo-600">Products</BackToCatalogue>
        <span>/</span>
        <span className="text-slate-700 font-medium">{product.category}</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate">{product.name}</span>
      </nav>

      {/* Product Detail Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full mb-2 border border-indigo-100">
              {product.category}
            </span>
            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          </div>

          <div className="text-right">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              ${product.price.toFixed(2)}
            </span>
            <div className="mt-2">
              {product.stock === 0 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
                  Out of stock
                </span>
              )}
              {product.stock > 0 && product.stock <= 20 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                  Low stock - only {product.stock} left
                </span>
              )}
              {product.stock > 20 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                  In stock
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="w-full h-64 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
          <ProductImage src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Description
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-slate-100">
          <BackToCatalogue className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            &larr; Back to Catalogue
          </BackToCatalogue>
          <span className="text-xs text-slate-400 font-mono">
            Last Updated: {new Date(product.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
