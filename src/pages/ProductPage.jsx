import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../contexts/StoreContext";
import api from "../services/api";

export default function SingleProductPage() {
  const { id: routeIdRaw } = useParams();
  const routeId = routeIdRaw ?? ""; // keep original string from URL
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  // comment related
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState(null);
  const [posting, setPosting] = useState(false);

  const toastTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const formatPrice = (p) => {
    const n = Number(p ?? 0);
    if (!Number.isFinite(n)) return "$0.00";
    try {
      return n.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      });
    } catch (e) {
      return `$${n.toFixed(2)}`;
    }
  };

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        id: parsed.id ?? parsed._id ?? parsed.userId ?? null,
        email: parsed.email ?? parsed.emailAddress ?? parsed.username ?? null,
        raw: parsed,
      };
    } catch (e) {
      return null;
    }
  };

  // helper: find a product in various store shapes
  function findProductInStore(products, idToMatch) {
    if (!products) return null;
    const asStr = (v) => (v === null || v === undefined ? "" : String(v));

    // direct keyed lookup (object keyed by id)
    if (typeof products === "object" && !Array.isArray(products)) {
      // try direct property
      if (products[idToMatch]) return products[idToMatch];
      if (products[String(idToMatch)]) return products[String(idToMatch)];
      // search values
      const vals = Object.values(products);
      for (const x of vals) {
        if (!x) continue;
        if (asStr(x._id) === asStr(idToMatch) || asStr(x.id) === asStr(idToMatch)) return x;
      }
      return null;
    }

    // array case
    if (Array.isArray(products)) {
      // first try to find by id property
      const found = products.find(
        (x) => x && (asStr(x._id) === asStr(idToMatch) || asStr(x.id) === asStr(idToMatch))
      );
      if (found) return found;

      // fallback: if idToMatch is a numeric-looking string, maybe caller used 1-based index links (index+1)
      const n = Number(idToMatch);
      if (Number.isFinite(n)) {
        const idx = Math.max(0, Math.floor(n) - 1); // treat as 1-based index fallback
        if (idx >= 0 && idx < products.length) return products[idx];
      }
    }

    // nothing matched
    return null;
  }

  // Fetch product
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function loadProduct() {
      setFetching(true);
      setError(null);

      try {
        // 1) store.fetchProduct (authoritative)
        if (typeof store?.fetchProduct === "function") {
          const res = await store.fetchProduct(routeId);
          const p = res?.data ?? res;
          if (!signal.aborted && mountedRef.current) {
            setProduct(p);
            setMainImage((p?.images && p.images[0]) || p?.image || "/assets/placeholder-rect.png");
          }
          return;
        }

        // 2) store.getProduct
        if (typeof store?.getProduct === "function") {
          const maybe = store.getProduct(routeId);
          const p = maybe && typeof maybe.then === "function" ? await maybe : maybe;
          if (!signal.aborted && mountedRef.current) {
            setProduct(p);
            setMainImage((p?.images && p.images[0]) || p?.image || "/assets/placeholder-rect.png");
          }
          return;
        }

        // 3) store.products (robust lookup)
        if (store?.products) {
          const p = findProductInStore(store.products, routeId);
          if (p) {
            if (!signal.aborted && mountedRef.current) {
              setProduct(p);
              setMainImage((p?.images && p.images[0]) || p?.image || "/assets/placeholder-rect.png");
            }
            return;
          }
        }

        // 4) fallback to API
        const res = await api.get(`/products/${routeId}`, { signal });
        const p = res?.data;
        if (!signal.aborted && mountedRef.current) {
          setProduct(p);
          setMainImage((p?.images && p.images[0]) || p?.image || "/assets/placeholder-rect.png");
        }
      } catch (err) {
        if (signal.aborted) return;
        console.error("Failed to load product:", err?.response ?? err);
        if (mountedRef.current) setError("Failed to load product.");
      } finally {
        if (mountedRef.current) setFetching(false);
      }
    }

    loadProduct();
    return () => controller.abort();
  }, [routeId, store]);

  // ---------- Hardened comments fetch (tries multiple likely endpoints) ----------
  useEffect(() => {
    const productId = product?._id ?? product?.id ?? routeId;
    if (!productId) return;

    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchComments() {
      try {
        // Try a few common endpoints / query param styles — be defensive because APIs differ
        const attempts = [
          () => api.get(`/comments/${productId}`, { signal }),
          () => api.get(`/comments`, { signal, params: { productId } }),
          () => api.get(`/comments`, { signal, params: { postId: productId } }),
          () => api.get(`/comments`, { signal, params: { parentPostid: productId } }),
          // fallback: fetch all and filter (last resort)
          () => api.get(`/comments`, { signal }),
        ];

        let response = null;
        for (let attempt of attempts) {
          try {
            response = await attempt();
            const d = response?.data;
            if (Array.isArray(d)) break;
            if (d && (Array.isArray(d.comments) || Array.isArray(d.data))) break;
          } catch (e) {
            response = null;
            continue;
          }
        }

        const payload = response?.data;
        let list = [];
        if (Array.isArray(payload)) {
          list = payload;
        } else if (Array.isArray(payload?.comments)) {
          list = payload.comments;
        } else if (Array.isArray(payload?.data)) {
          list = payload.data;
        } else if (payload && typeof payload === "object") {
          const maybeList = Array.isArray(payload) ? payload : payload.comments ?? payload.data ?? [];
          list = Array.isArray(maybeList) ? maybeList : [];
          if (
            list.length &&
            !list.some((c) => (c.parentPostid ?? c.post ?? c.productId) === productId)
          ) {
            list = list.filter(
              (c) =>
                c.parentPostid === productId ||
                c.post === productId ||
                c.productId === productId ||
                c.parent === productId
            );
          }
        }

        if (mountedRef.current) setComments(Array.isArray(list) ? list : []);
      } catch (err) {
        if (signal.aborted) return;
        console.error(`Error fetching comments for product ${productId}:`, err);
        if (mountedRef.current) setCommentError("Failed to load comments.");
      }
    }

    fetchComments();
    return () => controller.abort();
  }, [product, routeId]);
  // ---------------------------------------------------------------------------

  // ---------- UPDATED: Post comment handler (uses stored user) ----------
  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError(null);

    if (!newComment || !newComment.trim()) {
      setCommentError("Please enter a comment.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: location } });
      return;
    }

    const productId = product?._id ?? product?.id ?? routeId;
    if (!productId) {
      setCommentError("Product unavailable.");
      return;
    }

    const currentUser = getStoredUser();

    const payload = {
      content: newComment.trim(),
      parentPostid: productId,
      ...(currentUser?.id ? { author: currentUser.id } : {}),
    };

    try {
      setPosting(true);

      const res = await api.post("/comments/add", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const created = res?.data?.comment ?? res?.data ?? null;

      // If server returned created comment, use that; otherwise create a local optimistic comment
      if (created && (created._id || created.id)) {
        setComments((prev) => [created, ...(prev ?? [])]);
      } else {
        // optimistic local comment (temporary id)
        const temp = {
          id: `temp-${Date.now()}`,
          _id: `temp-${Date.now()}`,
          content: newComment.trim(),
          author: currentUser?.email ?? currentUser?.id ?? "Anonymous",
          parentPostid: productId,
          createdAt: new Date().toISOString(),
        };
        setComments((prev) => [temp, ...(prev ?? [])]);

        // try to refresh authoritative list in background (best-effort)
        try {
          const re = await api.get(`/comments/${productId}`);
          const payload2 = re?.data;
          const list = Array.isArray(payload2) ? payload2 : payload2?.comments ?? payload2?.data ?? [];
          if (mountedRef.current) setComments(Array.isArray(list) ? list : []);
        } catch (err2) {
          console.error("Error refetching comments after optimistic post:", err2);
        }
      }

      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
      const serverMsg = err?.response?.data?.message ?? err?.message ?? "Failed to post comment";
      if (mountedRef.current) setCommentError(serverMsg);
    } finally {
      if (mountedRef.current) setPosting(false);
    }
  };
  // -------------------------------------------------------

  const adjustQty = (delta) => {
    setQty((q) => {
      const next = Number(q) + delta;
      if (!Number.isFinite(next) || next < 1) return 1;
      if (next > 999) return 999;
      return next;
    });
  };

  // ------------------ Hardened addToCart ------------------
  const addToCart = async (opts = { redirectToCheckout: false }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: location } });
      return;
    }

    if (!product) {
      console.error("No product to add");
      return;
    }

    setLoading(true);
    setError(null);

    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    const productId = product._id ?? product.id ?? routeId;
    const payload = {
      // include a top-level id — many backends expect this
      productId,
      product: {
        id: productId,
        title: product.title ?? product.name ?? "",
        price: Number(product.price ?? product.amount ?? 0),
        image:
          product.image ??
          (Array.isArray(product.images) ? product.images[0] : product.images) ??
          "/assets/placeholder-rect.png",
      },
      quantity,
    };

    try {
      console.log("addToCart payload:", payload);

      // 1) If store provides addToCart, try it first (it may handle optimistic UI + sync)
      let res = null;
      if (typeof store?.addToCart === "function") {
        try {
          res = await store.addToCart(payload);
          // Some store.addToCart implementations return nothing — treat that as 'didn't set cart for us'
        } catch (storeErr) {
          console.warn("store.addToCart threw, falling back to API:", storeErr);
          res = null;
        }
      }

      // 2) If store didn't return a server response, call API directly
      if (!res) {
        const apiRes = await api.post("/cart/add", payload, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        res = apiRes?.data ?? apiRes;
        console.log("POST /cart/add response:", res);
      }

      // 3) Normalize server response into an array the store can accept
      let serverData = res?.cart ?? res?.items ?? res?.data ?? res;

      // If server returned object with items array nested, use that
      if (!Array.isArray(serverData) && serverData && typeof serverData === "object") {
        if (Array.isArray(serverData.items)) serverData = serverData.items;
        else if (Array.isArray(serverData.cart)) serverData = serverData.cart;
        // else: leave serverData as-is for further normalization
      }

      const normalizedCart = Array.isArray(serverData) ? serverData : [];

      // 4) If store exposes setCart, call it with a normalized array; else, try store.setState or console.warn
      if (typeof store?.setCart === "function") {
        try {
          store.setCart(normalizedCart);
        } catch (e) {
          console.warn("store.setCart failed to apply server response:", e);
        }
      } else if (typeof store?.setState === "function") {
        try {
          // if your store exposes setState
          store.setState((s) => ({ ...s, cart: normalizedCart }));
        } catch (e) {
          console.warn("store.setState failed to set cart:", e);
        }
      } else {
        // Not fatal, just log — app may be using another mechanism to sync cart
        console.log("No store setter found; normalizedCart:", normalizedCart);
      }

      if (mountedRef.current) {
        setToastVisible(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = window.setTimeout(() => {
          if (mountedRef.current) setToastVisible(false);
          toastTimeoutRef.current = null;
        }, 2500);
      }

      if (opts.redirectToCheckout) navigate("/checkout");
    } catch (err) {
      console.error("Failed to add product to cart:", err);
      if (err?.response) {
        console.error("Server response:", err.response.status, err.response.data);
        const serverMsg = err.response.data?.message ?? JSON.stringify(err.response.data);
        if (mountedRef.current) setError(typeof serverMsg === "string" ? serverMsg : "Failed to add to cart");
      } else {
        if (mountedRef.current) setError(err.message ?? "Failed to add to cart");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };
  // -------------------------------------------------------

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500">Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-red-600">{error}</div>
        <Link to="/" className="text-indigo-600 underline">
          Back to store
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500">No product data.</div>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : product.image ? [product.image] : [];
  const displayImage = mainImage ?? images[0] ?? "/assets/placeholder-rect.png";
  const title = product.title ?? product.name ?? "Untitled";
  const price = product.price ?? product.amount ?? 0;
  const desc = product.description ?? product.shortDescription ?? "No description available.";
  const inStock = product.stock == null ? true : Number(product.stock) > 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <Link to="/" className="inline-block text-sm text-gray-600 mb-4">
        ← Back to catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-4">
          <div className="w-full h-96 rounded overflow-hidden flex items-center justify-center bg-gray-50">
            <img
              src={displayImage}
              alt={title}
              className="max-h-full max-w-full object-contain transition-transform transform hover:scale-105"
            />
          </div>
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto">
              {images.map((src, idx) => (
                <button
                  key={String(src) + idx}
                  onClick={() => setMainImage(src)}
                  className="w-20 h-20 rounded overflow-hidden border focus:ring-2 focus:ring-indigo-300"
                  aria-label={`Show image ${idx + 1}`}
                >
                  <img src={src} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="mt-2 text-lg font-semibold">{formatPrice(price)}</div>
            <div className="mt-4 text-sm text-gray-700 leading-relaxed">{desc}</div>
            <div className="mt-4 text-sm text-gray-600">
              {product.brand && (
                <div>
                  <strong>Brand:</strong> {product.brand}
                </div>
              )}
              {product.category && (
                <div>
                  <strong>Category:</strong> {product.category}
                </div>
              )}
              {product.sku && (
                <div>
                  <strong>SKU:</strong> {product.sku}
                </div>
              )}
              {/* Debug ID (remove later) */}
              <div className="text-xs text-gray-400 mt-2">ID: {product._id ?? product.id ?? routeId}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded">
                <button
                  onClick={() => adjustQty(-1)}
                  className="px-3 py-2 text-sm disabled:opacity-50"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={qty}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const v = parseInt(raw, 10);
                    setQty(Number.isFinite(v) && v > 0 ? v : raw === "" ? "" : 1);
                  }}
                  className="w-16 text-center py-2 outline-none"
                  aria-label="Quantity"
                />
                <button
                  onClick={() => adjustQty(1)}
                  className="px-3 py-2 text-sm"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => addToCart({ redirectToCheckout: false })}
                disabled={loading || !inStock}
                className={`ml-2 px-4 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                  loading || !inStock
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-900"
                }`}
                aria-pressed={loading}
              >
                {loading ? "Adding..." : inStock ? "Add to cart" : "Out of stock"}
              </button>
              <button
                onClick={async () => {
                  await addToCart({ redirectToCheckout: true });
                }}
                disabled={loading || !inStock}
                className={`ml-2 px-4 py-2 rounded text-sm font-medium border ${
                  loading || !inStock ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                }`}
              >
                Buy now
              </button>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {inStock ? <span>In stock</span> : <span className="text-red-600">Out of stock</span>}
            </div>
          </div>
        </div>
      </div>

      {/* COMMENT SECTION: form first, then list */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>

        {/* Comment form placed above the list so it's the first thing users see */}
        <form onSubmit={handleAddComment} className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-300"
            disabled={posting}
          />
          <button
            type="submit"
            disabled={posting}
            className={`py-2 px-4 rounded transition ${posting ? "bg-gray-400 text-gray-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </form>

        {commentError && <div className="text-red-600 mb-4">{commentError}</div>}

        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => {
              // defensive extraction of author and date
              const authorName =
                comment.author?.name || comment.author?.email || comment.author || comment.createdBy || "Anonymous";
              const dateVal = comment.createdAt ?? comment.created_at ?? comment.date ?? comment.timestamp;
              const key = comment._id ?? comment.id ?? comment.tempId ?? comment.key ?? `${authorName}-${dateVal ?? Math.random()}`;
              return (
                <li key={key} className="border-b pb-4">
                  <p className="text-sm text-gray-700">{comment.content ?? comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    By {authorName} on {dateVal ? new Date(dateVal).toLocaleDateString() : "Unknown date"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className={`fixed left-1/2 bottom-6 z-50 transform -translate-x-1/2 transition-all duration-300 ${
          toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        <div className="bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">Added to cart</span>
        </div>
      </div>
    </div>
  );
}
