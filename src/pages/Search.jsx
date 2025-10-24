// src/pages/Search.jsx
import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../contexts/StoreContext";
import ProductGrid from "../components/ProductGrid";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [q, setQ] = useState(query);
  const { products, loading } = useStore();

  const filtered = useMemo(() => {
    if (!q) return products;
    const s = q.toLowerCase();
    return products.filter(p => (p.title ?? "").toLowerCase().includes(s) || (p.description ?? "").toLowerCase().includes(s));
  }, [products, q]);

  const onSubmit = (e) => {
    e.preventDefault();
    setParams({ q });
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="max-w-2xl mx-auto mb-6">
        <input className="w-full p-3 border rounded" value={q} onChange={e => setQ(e.target.value)} placeholder="Search products..." />
      </form>

      <ProductGrid products={filtered} loading={loading} />
    </div>
  );
}
