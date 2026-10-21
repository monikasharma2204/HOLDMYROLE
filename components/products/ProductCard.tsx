import Link from "next/link";
import ProductImage from "./ProductImage";
import { ProductItem } from "@/lib/api/client";

interface ProductCardProps {
  product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-200"
    >
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-600 uppercase">
            {product.category}
          </span>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
            Stock: {product.stock}
          </span>
        </div>

        <h2 className="font-bold text-slate-900 mt-1 line-clamp-1">{product.name}</h2>
        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{product.description}</p>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
            View Details &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}