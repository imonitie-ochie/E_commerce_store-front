// src/pages/Cart.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Loading from "../components/Loading";

const API_BASE = "https://ecommerce-zv1v.onrender.com/cart";
const API_PAY = "https://ecommerce-zv1v.onrender.com/transaction/pay";

function QtyControl({ value = 1, onChange }) {
  const [v, setV] = useState(String(value));
  React.useEffect(() => setV(String(value)), [value]);

  const apply = (next) => {
    const n = Number(next) || 0;
    if (n < 1) return;
    setV(String(n));
    onChange(n);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => apply(Math.max(1, Number(v) - 1))}
        className="w-8 h-8 flex items-center justify-center rounded border"
        aria-label="decrease quantity"
      >
        −
      </button>

      <input
        value={v}
        onChange={(e) => setV(e.target.value.replace(/\D/g, ""))}
        onBlur={() => apply(v)}
        className="w-14 text-center p-1 border rounded"
        aria-label="quantity"
      />

      <button
        onClick={() => apply(Number(v) + 1)}
        className="w-8 h-8 flex items-center justify-center rounded border"
        aria-label="increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [paystackUrl, setPaystackUrl] = useState("");
  const nav = useNavigate();

  // Fetch cart
  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCart([]);
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/view`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCart(res.data?.items ?? []);
    } catch (err) {
      console.error("Failed to fetch cart", err?.response ?? err);
      setError("Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const withAction = async (actionFn, actionId) => {
    try {
      setActionLoading(actionId);
      await actionFn();
      await fetchCart();
    } catch (err) {
      console.error(err?.response ?? err);
      setError(err?.response?.data?.message || err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Helpers
  const removeItem = (title) =>
    withAction(
      async () => {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        await axios.delete(`${API_BASE}/remove/${encodeURIComponent(title)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      },
      `remove:${title}`
    );

  const increase = (title) =>
    withAction(
      async () => {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_BASE}/increase/${encodeURIComponent(title)}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      },
      `increase:${title}`
    );

  const decrease = (title) =>
    withAction(
      async () => {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_BASE}/decrease/${encodeURIComponent(title)}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      },
      `decrease:${title}`
    );

  const setQuantity = (title, newQty) =>
    withAction(
      async () => {
        const token = localStorage.getItem("token");
        try {
          await axios.put(
            `${API_BASE}/update/${encodeURIComponent(title)}`,
            { qty: newQty },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          const current =
            cart.find((it) => (it.product?.title ?? it.title) === title)
              ?.quantity || 0;
          const diff = newQty - current;
          if (diff > 0) {
            for (let i = 0; i < diff; i++) {
              await axios.put(
                `${API_BASE}/increase/${encodeURIComponent(title)}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          } else if (diff < 0) {
            for (let i = 0; i < Math.abs(diff); i++) {
              await axios.put(
                `${API_BASE}/decrease/${encodeURIComponent(title)}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          }
        }
      },
      `set:${title}`
    );

  const clearCart = () =>
    withAction(
      async () => {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_BASE}/clear`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      },
      "clear"
    );

  const subtotal = useMemo(
    () =>
      cart.reduce((s, it) => {
        const price = Number(it.product?.price ?? it.price ?? 0);
        const qty = Number(it.quantity ?? it.qty ?? 0);
        return s + price * qty;
      }, 0),
    [cart]
  );

  const shipping = subtotal > 0 ? 3.5 : 0;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    setError("");
    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const amount = Math.round(total);

      const res = await axios.post(
        API_PAY,
        { amount, email: user?.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const checkoutUrl =
        res.data?.data?.data?.authorization_url ||
        res.data?.data?.authorization_url ||
        res.data?.authorization_url;

      if (checkoutUrl) {
        setPaystackUrl(checkoutUrl);
        window.open(checkoutUrl, "_blank");
      } else {
        setError("Failed to initialize payment.");
      }
    } catch (err) {
      console.error("Payment error", err?.response ?? err);
      setError(err?.response?.data?.message || err.message || "Payment failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>

      {cart.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center">
          <p className="text-gray-700 mb-4">Your cart is empty.</p>
          <button
            onClick={() => nav("/")}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Continue shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, idx) => {
              const product = item.product ?? item;
              const title = product?.title ?? product?.name ?? `item-${idx}`;
              const id = item._id ?? idx;
              const price = Number(product?.price ?? 0);
              const qty = Number(item.quantity ?? item.qty ?? 1);

              return (
                <div
                  key={id}
                  className="bg-white p-4 rounded shadow flex gap-4 items-center"
                >
                  <img
                    src={product?.image}
                    alt={title}
                    className="w-28 h-28 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      ₦{price.toFixed(2)} each
                    </div>
                    <div className="mt-3 flex items-center gap-6">
                      <QtyControl
                        value={qty}
                        onChange={(newQty) => setQuantity(title, newQty)}
                      />
                      <button
                        onClick={() => removeItem(title)}
                        className="text-sm text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₦{(price * qty).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Subtotal</div>
            <div className="text-2xl font-bold mb-4">
              ₦{subtotal.toFixed(2)}
            </div>

            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <div>Shipping</div>
              <div>₦{shipping.toFixed(2)}</div>
            </div>

            <div className="flex justify-between text-lg font-semibold mb-4">
              <div>Total</div>
              <div>₦{total.toFixed(2)}</div>
            </div>

            {error && (
              <div className="text-sm text-red-600 mb-3">{error}</div>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full py-3 bg-green-600 text-white rounded mb-3 disabled:opacity-60"
            >
              {checkoutLoading
                ? "Initializing payment..."
                : "Proceed to Checkout"}
            </button>

            {paystackUrl && (
              <a
                href={paystackUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full inline-block text-center py-2 border rounded bg-indigo-600 text-white"
              >
                Continue to Paystack
              </a>
            )}

            <button
              onClick={() => nav("/")}
              className="w-full py-2 border rounded mt-2"
            >
              Continue shopping
            </button>

            <button
              onClick={clearCart}
              disabled={actionLoading === "clear"}
              className="w-full py-2 mt-3 bg-red-600 text-white rounded disabled:opacity-60"
            >
              {actionLoading === "clear" ? "Clearing..." : "Clear cart"}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
