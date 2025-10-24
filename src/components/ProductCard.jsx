import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ProductCard({ product }) {
  const id = product._id ?? product.id;
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const timeoutRef = useRef(null);

  const img = product.image ?? product.images?.[0] ?? "/assets/placeholder-rect.png";
  const title = product.title ?? product.name ?? "Untitled";
  const price = Number(product.price ?? product.amount ?? 0).toFixed(2);

  const addToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("User not authenticated");
      // Optionally: Redirect to login or show prompt
      return;
    }

    setLoading(true);

    try {
      await api.post(
        "/cart/add",
        { product },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(true); // Success toast
    } catch (err) {
      console.error("Failed to add product to cart:", err?.response ?? err);
      showToast(false); // Error toast
    } finally {
      setLoading(false);
    }
  };

  const showToast = (isSuccess) => {
    setToastVisible(isSuccess);
    setErrorVisible(!isSuccess);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      setErrorVisible(false);
      timeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="border rounded-lg p-4 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <Link to={`/product/${id}`} className="flex-1">
        <div className="w-full h-48 overflow-hidden rounded-lg">
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        <div className="mt-4">
          <h3 className="text-base font-semibold line-clamp-2 text-gray-800">{title}</h3>
          <div className="mt-2 text-lg font-bold text-gray-900">${price}</div>
        </div>
      </Link>

      <div className="mt-4">
        <button
          onClick={addToCart}
          disabled={loading}
          className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
            ${loading
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
            }`}
          aria-pressed={loading}
        >
          {loading ? "Adding..." : "Add to Cart"}
        </button>
      </div>

      {/* Success Toast */}
      <div
        aria-live="polite"
        className={`fixed left-1/2 bottom-8 z-50 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300
          ${toastVisible ? "opacity-100 translate-y-0 bg-green-600 text-white" : "opacity-0 translate-y-6 pointer-events-none"}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z"
            clipRule="evenodd"
          />
        </svg>
        <span>Added to cart successfully!</span>
      </div>

      {/* Error Toast */}
      <div
        aria-live="polite"
        className={`fixed left-1/2 bottom-8 z-50 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300
          ${errorVisible ? "opacity-100 translate-y-0 bg-red-600 text-white" : "opacity-0 translate-y-6 pointer-events-none"}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 10.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span>Failed to add to cart. Please try again.</span>
      </div>
    </div>
  );
}