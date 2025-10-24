// src/pages/Wishlist.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import Loading from "../components/Loading";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Wishlist() {
  const { user, token } = useAuth(); // ✅ same as localStorage keys
  const { addToCart } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // normalize raw API item
  const normalizeItem = (raw) => {
    if (!raw) return null;
    const productObj =
      (raw.productId && typeof raw.productId === "object" ? raw.productId : null) ||
      (raw.product && typeof raw.product === "object" ? raw.product : null) ||
      (typeof raw === "object" ? raw : null);

    if (!productObj) return null;

    const productTitle = (productObj.title || productObj.name || productObj.productName || "")
      .toString()
      .trim();

    const productId =
      productObj._id ?? productObj.id ?? raw.productId?._id ?? raw.productId ?? null;

    return {
      product: productObj,
      productTitle,
      productId: productId ? String(productId) : null,
    };
  };

  // Load wishlist
  const loadWishlist = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/wishlist/get_users_items", {
        headers: { Authorization: `Bearer ${token}` }, // ✅ proper call
      });

      const rawItems = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const normalized = rawItems.map(normalizeItem).filter(Boolean);
      setItems(normalized);

      if (!normalized.length && rawItems.length) {
        setError("Some wishlist items could not be processed.");
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err?.response ?? err);
      setError("Failed to load wishlist. Please try again later.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Remove from wishlist
  const removeFromWishlistServer = async (productTitle) => {
    if (!productTitle || !token) return;
    const encoded = encodeURIComponent(productTitle);
    await api.delete(`/wishlist/remove/${encoded}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  // Add to cart + remove from wishlist
  const addToCartHandler = async (product, productTitle) => {
    if (!product || !productTitle) return;
    setActionLoading(productTitle);
    try {
      await addToCart(product, 1);
      await removeFromWishlistServer(productTitle);
      setItems((prev) => prev.filter((i) => i.productTitle !== productTitle));
      toast.success("Item added to cart and removed from wishlist!");
    } catch (err) {
      console.error("Add to cart failed:", err);
      toast.error("Failed to add item to cart.");
    } finally {
      setActionLoading(null);
    }
  };

  const removeFromWishlist = async (productTitle) => {
    if (!productTitle) return;
    setActionLoading(productTitle);
    try {
      await removeFromWishlistServer(productTitle);
      setItems((prev) => prev.filter((i) => i.productTitle !== productTitle));
      toast.success("Item removed from wishlist!");
    } catch (err) {
      console.error("Remove wishlist item failed:", err?.response ?? err);
      toast.error("Failed to remove item from wishlist.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg">Please sign in to view your wishlist.</p>
        <Link to="/login" className="text-indigo-600 hover:underline">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Your Wishlist</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded" role="alert">
          {error}
        </div>
      )}

      {!items.length && !error && (
        <div className="text-center text-gray-500">
          <p className="text-lg">Your wishlist is empty.</p>
          <Link to="/" className="text-indigo-600 hover:underline">
            Browse products
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {items.map(({ product, productTitle }) => (
          <div key={productTitle || Math.random()} className="bg-white p-4 rounded-lg shadow-md">
            <img
              src={product?.image ?? product?.images?.[0] ?? "/assets/placeholder-rect.png"}
              alt={product?.title ?? product?.name ?? "Wishlist item"}
              className="w-full h-48 object-cover rounded-md mb-3"
            />
            <div className="font-medium text-lg">
              {productTitle || product?.title || product?.name || "Untitled product"}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              ₦{Number(product?.price ?? product?.priceAmount ?? 0).toFixed(2)}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => addToCartHandler(product, productTitle)}
                disabled={actionLoading === productTitle}
                className="flex-1 py-2 bg-black text-white rounded-md disabled:bg-gray-400"
              >
                {actionLoading === productTitle ? "Adding..." : "Add to cart"}
              </button>
              <button
                onClick={() => removeFromWishlist(productTitle)}
                disabled={actionLoading === productTitle}
                className="py-2 px-4 border rounded-md disabled:border-gray-300 disabled:text-gray-400"
              >
                {actionLoading === productTitle ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
