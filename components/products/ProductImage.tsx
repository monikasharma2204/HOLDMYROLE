"use client";

import { useState } from "react";

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-slate-400">
        No image
      </div>
    );
  }


  return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />;
}
