import React from "react";
import ProductCard from "./ProductCard";

/**
 * Small responsive grid tuned to match screenshot density
 * mobile: 2 columns, sm: 3, lg: 4, xl: 5 (adjust as you prefer)
 */
export default function ProductGrid({ products = [], loading = false }) {
  if (loading) {
    // show skeleton placeholders
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse border rounded p-3">
            <div className="bg-gray-200 h-36 mb-3 rounded" />
            <div className="h-4 bg-gray-200 mb-1 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return <div className="text-gray-500">No products found.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((p) => (
        <ProductCard key={p._id || p.id} product={p} />
      ))}
    </div>
  );
}
