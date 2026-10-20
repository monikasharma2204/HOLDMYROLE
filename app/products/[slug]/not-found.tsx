import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="max-w-md mx-auto py-12 text-center space-y-4">
      <div className="text-4xl">🔍</div>
      <h1 className="text-2xl font-bold text-slate-900">Product Not Found</h1>
      <p className="text-sm text-slate-500">
        The requested product could not be found or is currently inactive in the catalogue.
      </p>
      <div className="pt-2">
        <Link
          href="/products"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
        >
          &larr; Back to Products Catalogue
        </Link>
      </div>
    </div>
  );
}
