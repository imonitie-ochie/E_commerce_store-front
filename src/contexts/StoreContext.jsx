import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const StoreContext = createContext();
export const useStore = () => useContext(StoreContext);

const productApi = axios.create({ baseURL: "https://fakestoreapi.com" });
const cartApi = axios.create({ baseURL: "https://ecommerce-zv1v.onrender.com" });

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cart")) || []; } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wishlist")) || []; } catch { return []; }
  });
  const [loading, setLoading] = useState(false);

  // debounce timer ref for syncing
  const syncTimer = useRef(null);
  // track whether initial server cart load happened (to avoid overwriting server cart)
  const initialServerCartLoaded = useRef(false);

  // normalize helper (same as other places)
  const normalize = (p) => {
    if (!p) return p;
    return {
      _id: p._id ?? p.id ?? p.productId ?? null,
      title: p.title ?? p.name ?? p.productName ?? "",
      price: p.price ?? p.amount ?? p.product?.price ?? 0,
      image: p.image ?? p.images?.[0] ?? p.product?.image ?? "/assets/placeholder-rect.png",
      qty: p.qty ?? p.quantity ?? p.qty ?? 1,
      category: p.category ?? p.cat ?? null,
      description: p.description ?? p.desc ?? "",
      ...p,
    };
  };

  // -------------------------
  // Products & categories
  // -------------------------
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.get("/products");
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setProducts(data.map(normalize));
    } catch (e) {
      console.error("fetchProducts error", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await productApi.get("/products/categories");
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setCategories(data);
    } catch (e) {
      console.error("fetchCategories error", e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // -------------------------
  // Server cart helpers
  // -------------------------
  const loadServerCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return [];
    try {
      const res = await cartApi.get("/cart/view", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const serverData = Array.isArray(res.data) ? res.data : res.data?.items || [];
      const serverItems = serverData.map((it) => {
        const p = it.product || it;
        const id = it.productId || p.id || p._id;
        const qty = it.quantity || it.qty;
        return normalize({ ...p, _id: id, qty });
      });
      return serverItems;
    } catch (err) {
      console.warn("loadServerCart failed", err);
      return [];
    }
  };

  const syncCartToServer = async (localCart) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const server = await loadServerCart();
      const localMap = new Map(localCart.map((i) => [i._id, i.qty]));
      const serverMap = new Map(server.map((i) => [i._id, i.qty]));

      // Removes: server has but local not
      for (const [id] of serverMap) {
        if (!localMap.has(id)) {
          await cartApi.delete(`/cart/remove/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      // Adds and updates
      for (const [id, localQty] of localMap) {
        const serverQty = serverMap.get(id) || 0;
        const delta = localQty - serverQty;
        if (delta > 0) {
          if (serverQty === 0) {
            // Add the item first (assumes add adds with qty=1)
            await cartApi.post(
              `/cart/add`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            // Then increase for the remaining qty - 1
            for (let k = 0; k < localQty - 1; k++) {
              await cartApi.put(
                `/cart/increase/${id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          } else {
            // Normal increase
            for (let k = 0; k < delta; k++) {
              await cartApi.put(
                `/cart/increase/${id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          }
        } else if (delta < 0) {
          for (let k = 0; k < -delta; k++) {
            await cartApi.put(
              `/cart/decrease/${id}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }
      }
    } catch (err) {
      console.error("sync failed", err);
    }
  };

  const removeItemOnServer = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      await cartApi.delete(`/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (err) {
      console.warn("removeItemOnServer failed", err.message || err);
      return false;
    }
  };

  // Debounced sync -> call syncCartToServer after a small delay
  const scheduleSync = (items) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      await syncCartToServer(items);
      syncTimer.current = null;
    }, 700);
  };

  // Merge local cart and server cart on login
  const mergeCarts = (local, server) => {
    const map = new Map();
    local.forEach((item) => {
      const id = item._id ?? item.id;
      if (!id) return;
      map.set(id, { ...item, qty: (map.get(id)?.qty ?? 0) + (item.qty ?? 1) });
    });
    server.forEach((item) => {
      const id = item._id ?? item.id ?? item.productId;
      if (!id) return;
      map.set(id, { ...normalize(item), qty: (map.get(id)?.qty ?? 0) + (item.qty ?? 1) });
    });
    return Array.from(map.values());
  };

  // -------------------------
  // Cart actions (local + server sync)
  // -------------------------
  const addToCart = (product, qty = 1) => {
    const p = normalize(product);
    setCart((prev) => {
      const exists = prev.find((i) => (i._id ?? i.id) === p._id);
      let next;
      if (exists) {
        next = prev.map((i) =>
          (i._id ?? i.id) === p._id ? { ...i, qty: (i.qty || 0) + qty } : i
        );
      } else {
        next = [...prev, { ...p, qty }];
      }
      localStorage.setItem("cart", JSON.stringify(next));
      if (user) scheduleSync(next);
      return next;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = prev.filter((i) => (i._id ?? i.id) !== productId);
      localStorage.setItem("cart", JSON.stringify(next));
      if (user) {
        removeItemOnServer(productId).then((ok) => {
          if (!ok) scheduleSync(next);
        });
      }
      return next;
    });
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return;
    setCart((prev) => {
      const next = prev.map((i) =>
        (i._id ?? i.id) === productId ? { ...i, qty } : i
      );
      localStorage.setItem("cart", JSON.stringify(next));
      if (user) scheduleSync(next);
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
    if (user) {
      const token = localStorage.getItem("token");
      if (token) {
        cartApi.delete("/cart/clear", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
      }
    }
  };

  // -------------------------
  // On user login/logout: sync / merge carts
  // -------------------------
  useEffect(() => {
    let mounted = true;
    const onAuthChange = async () => {
      if (user) {
        const server = await loadServerCart();
        if (!mounted) return;

        const local = JSON.parse(localStorage.getItem("cart") || "[]");
        let merged;
        if (local.length && server.length) {
          merged = mergeCarts(local, server);
          setCart(merged);
          localStorage.setItem("cart", JSON.stringify(merged));
          scheduleSync(merged);
        } else if (!local.length && server.length) {
          setCart(server);
          localStorage.setItem("cart", JSON.stringify(server));
        } else if (local.length && !server.length) {
          scheduleSync(local);
        }
        initialServerCartLoaded.current = true;
      } else {
        initialServerCartLoaded.current = false;
      }
    };

    onAuthChange();
    return () => { mounted = false; };
  }, [user]);

  // If cart changes while user is logged in and initial load already happened,
  // schedule sync (this covers updates that happen after login)
  useEffect(() => {
    if (user && initialServerCartLoaded.current) {
      scheduleSync(cart);
    }
  }, [cart, user]);

  // persist wishlist
  useEffect(() => { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  return (
    <StoreContext.Provider value={{
      products, categories, cart, wishlist, loading,
      fetchProducts, fetchCategories,
      addToCart, removeFromCart, updateQty, clearCart,
      addToWishlist: (p) => { setWishlist(prev => prev.some(i => (i._id ?? i.id) === (p._id ?? p.id)) ? prev : [...prev, normalize(p)]); },
      removeFromWishlist: (id) => setWishlist(prev => prev.filter(i => (i._id ?? i.id) !== id)),
      setCart // exported for direct use in pages if ever needed
    }}>
      {children}
    </StoreContext.Provider>
  );
};