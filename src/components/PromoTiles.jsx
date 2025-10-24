import React from "react";
import { Link } from "react-router-dom";

/**
 * Two stacked promo tiles to the right of the hero on desktop,
 * on mobile they stack below hero.
 */
export default function PromoTiles() {
  return (
    <div className="space-y-4">
      <Link to="/category/sale" className="block rounded-lg overflow-hidden shadow-sm">
        <div className="h-36 sm:h-44 lg:h-28 bg-[url('/assets/promo-1.jpg')] bg-cover bg-center flex items-end">
          <div className="w-full bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
            <div className="text-sm uppercase font-semibold">Big Sale</div>
            <div className="text-lg font-bold">Up to 50% off</div>
          </div>
        </div>
      </Link>

      <Link to="/category/new" className="block rounded-lg overflow-hidden shadow-sm">
        <div className="h-36 sm:h-44 lg:h-28 bg-[url('/assets/promo-2.jpg')] bg-cover bg-center flex items-end">
          <div className="w-full bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
            <div className="text-sm uppercase font-semibold">New Arrivals</div>
            <div className="text-lg font-bold">Just landed</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
