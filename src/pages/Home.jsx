import React from "react";
import HeroCarousel from "../components/HeroCarousel";
import image from "../assets/Hero.png"

import ProductGrid from "../components/ProductGrid";
import { useStore } from "../contexts/StoreContext";
export default function Home() {
  const { products, loading } = useStore();

  return (
    <div className="space-y-8">
      {/* top layout: hero (big) + right promos (stacked) */}
      <div className="relative w-full h-[400px] overflow-hidden border-4 border-balck">
        <img
          src={image}
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center text-white px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Welcome to Our Store
          </h1>
          <p className="text-lg md:text-2xl mb-6 max-w-2xl">
            Discover top-quality products and amazing deals today.
          </p>
          <a
            href="/category"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
          >
            Shop Now
          </a>
        </div>
      </div>


      {/* product grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Featured Products</h2>
          <div className="text-sm text-gray-500">{loading ? "Updating..." : `${products.length} items`}</div>
        </div>

        <ProductGrid products={products} loading={loading} />
      </section>
    </div>
  );
}
