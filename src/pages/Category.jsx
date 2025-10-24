// src/pages/Category.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import ProductGrid from "../components/ProductGrid";
import { useStore } from "../contexts/StoreContext";

export default function Category() {
  const { slug } = useParams(); // e.g. "electronics"
  const { products, loading, fetchProducts } = useStore();

  // Local state
  const [catProducts, setCatProducts] = useState([]); // products fetched specifically for this category (fallback to all)
  const [localLoading, setLocalLoading] = useState(false);
  const [sort, setSort] = useState(""); // "" | "asc" | "desc"
  const [currentCategory, setCurrentCategory] = useState("all");

  // Fetch either the category endpoint or all products from FakeStore (fallback to useStore products)
  useEffect(() => {
    let mounted = true;

    const fetchByFakeStore = async () => {
      try {
        setLocalLoading(true);

        const endpoint = slug
          ? `https://fakestoreapi.com/products/category/${encodeURIComponent(slug)}`
          : `https://fakestoreapi.com/products`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("FakeStore fetch failed");
        const data = await res.json();

        // normalize
        const normalized = data.map((p) => ({
          id: p.id ?? p._id,
          title: p.title,
          price: Number(p.price),
          image: p.image,
          description: p.description,
          category: p.category,
        }));

        if (mounted) setCatProducts(normalized);
      } catch (err) {
        // fallback: try to use products already in the store
        const fallback = (slug
          ? products.filter(
              (p) =>
                p.category && (p.category.slug === slug || p.category === slug)
            )
          : products
        ).map((p) => ({
          id: p.id ?? p._id,
          title: p.title,
          price: Number(p.price),
          image: p.image,
          description: p.description,
          category: p.category,
        }));

        if (mounted) setCatProducts(fallback);
      } finally {
        if (mounted) setLocalLoading(false);
      }
    };

    fetchByFakeStore();

    // ensure global products are loaded so we can build category list
    if (!products.length) fetchProducts();

    return () => {
      mounted = false;
    };
  }, [slug, products, fetchProducts]);

  // Build category list (use store products if available, otherwise catProducts)
  const categories = useMemo(() => {
    const source = products.length ? products : catProducts;
    const unique = Array.from(
      new Set(source.map((p) => p.category).filter(Boolean))
    );
    return ["all", ...unique];
  }, [products, catProducts]);

  // Determine source for displayed products: if we fetched category-specific products (slug) use that,
  // otherwise use store products (which likely contain all products) or fallback to catProducts
  const sourceProducts = useMemo(() => {
    if (slug) return catProducts;
    if (products && products.length)
      return products.map((p) => ({
        id: p.id ?? p._id,
        title: p.title,
        price: Number(p.price),
        image: p.image,
        description: p.description,
        category: p.category,
      }));
    return catProducts;
  }, [slug, products, catProducts]);

  // Derived displayedProducts with category and sort applied
  const displayedProducts = useMemo(() => {
    let arr = Array.isArray(sourceProducts) ? [...sourceProducts] : [];

    // Filter by currentCategory
    if (currentCategory && currentCategory !== "all") {
      arr = arr.filter((p) => p.category === currentCategory);
    }

    // Apply sort
    if (sort === "asc") arr.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "desc")
      arr.sort((a, b) => Number(b.price) - Number(a.price));

    return arr;
  }, [sourceProducts, currentCategory, sort]);

  const isLoading = loading || localLoading;

  // Handlers
  const handleCategoryClick = (cat) => {
    setCurrentCategory(cat);
  };

  const handleClearFilters = () => {
    setSort("");
    setCurrentCategory("all");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold capitalize">
          {slug ? slug.replace(/-/g, " ") : "All Products"}
        </h2>
      </div>

      {/* Categories + Sort on same line */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Categories left (will wrap if too many) */}
        <div id="categorySection" className="flex gap-2 flex-wrap items-center">
          {categories.map((cat) => (
            <button
              key={String(cat)}
              className={`px-3 py-2 rounded-md border transition-colors duration-150 whitespace-nowrap ${
                cat === currentCategory
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-200 text-gray-800 border-transparent hover:bg-blue-500 hover:text-white"
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {typeof cat === "string"
                ? cat.charAt(0).toUpperCase() + cat.slice(1)
                : String(cat)}
            </button>
          ))}
        </div>

        {/* Sort controls right */}
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="sr-only">Sort by price</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="p-2 border rounded"
            aria-label="Sort by price"
          >
            <option value="">Sort by Price</option>
            <option value="desc">Highest → Lowest</option>
            <option value="asc">Lowest → Highest</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="p-2 border rounded bg-white hover:bg-gray-50"
            aria-label="Clear sort"
          >
            Clear
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <ProductGrid products={displayedProducts} loading={false} />
      )}
    </div>
  );
}
