"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BackToCatalogueProps {
  children: React.ReactNode;
  className?: string;
}

export default function BackToCatalogue({ children, className }: BackToCatalogueProps) {
  const [href, setHref] = useState("/products");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("catalogueUrl");
      if (saved) setHref(saved);
    } catch {

    }
  }, []);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
