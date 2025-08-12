"use client";

import React, { Suspense } from "react";
import FilterableCatalog from "@/components/FilterableCatalog";
import { useSearchParams } from "next/navigation";

// Original content of KatalogPage moved to KatalogPageContent
function KatalogPageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search");

  return (
    <div>
      <FilterableCatalog initialCategory={searchQuery} />
    </div>
  );
}

export default function KatalogPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading Catalog...</div>}>
      <KatalogPageContent />
    </Suspense>
  );
}
