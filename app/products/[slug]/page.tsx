import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { formatProduct } from "@/lib/utils/format";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = params;

  // Resolve product dynamically from database
  const rawProduct = await prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
    },
  });

  if (!rawProduct) {
    notFound();
  }

  const product = formatProduct(rawProduct);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link href="/products" className="hover:text-indigo-600">
          Products
        </Link>
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
            <p className="text-xs font-mono text-slate-400 mt-1">Slug: {product.slug}</p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              ${product.price.toFixed(2)}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Stock: <span className="font-semibold text-slate-700">{product.stock} units</span>
            </p>
          </div>
        </div>

        {product.imageUrl && (
          <div className="w-full h-64 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Description
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Technical Contract / Candidate Callout */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
          <p className="font-semibold text-slate-700">Intern Assessment Notice:</p>
          <p className="text-slate-600">
            This page is dynamically rendered from the backend API/database model. The candidate intern is expected to build a rich visual interface, including an image gallery, quantity selector, add-to-cart state, and related product recommendations.
          </p>
          <div className="font-mono text-slate-500 pt-1">
            Product UUID: {product.id}
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-slate-100">
          <Link
            href="/products"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            &larr; Back to Catalogue
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            Last Updated: {new Date(product.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
