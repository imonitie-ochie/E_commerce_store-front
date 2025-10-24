// src/pages/Checkout.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../contexts/StoreContext";
import api from "../services/api";
import Loading from "../components/Loading";

export default function Checkout() {
  const { cart, clearCart } = useStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    paymentMethod: "card",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const subtotal = cart.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || it.quantity || 1)), 0);
  const shipping = subtotal > 0 ? 3.5 : 0;
  const total = subtotal + shipping;

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.email) {
      return alert("Please fill in name, email and address.");
    }
    if (!cart.length) return alert("Cart is empty.");

    setLoading(true);
    try {
      // Prepare order payload (snapshot)
      const items = cart.map(i => ({
        productId: i._id ?? i.id,
        title: i.title ?? i.name,
        price: Number(i.price ?? i.amount ?? 0),
        quantity: Number(i.qty ?? i.quantity ?? 1),
        image: i.image ?? (i.images?.[0] || "")
      }));

      const payload = {
        items,
        address: form.address,
        customer: { name: form.name, email: form.email },
        shipping,
        tax: 0,
        total,
        payment: { provider: form.paymentMethod, status: "pending" },
        meta: { source: "web" }
      };

      const res = await api.post("/orders", payload);
      const orderId = res?.data?._id ?? res?.data?.id ?? null;

      // clear cart locally
      clearCart();

      // navigate to confirmation with order id
      navigate("/order-confirmation", { state: { orderId } });
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <Loading text="Loading cart..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
          <div>
            <label className="block text-sm mb-1">Full name</label>
            <input value={form.name} onChange={e => handleChange("name", e.target.value)} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block text-sm mb-1">Shipping address</label>
            <textarea value={form.address} onChange={e => handleChange("address", e.target.value)} className="w-full border p-2 rounded" rows={4} required />
          </div>

          <div>
            <label className="block text-sm mb-1">Payment method</label>
            <select value={form.paymentMethod} onChange={e => handleChange("paymentMethod", e.target.value)} className="w-full border p-2 rounded">
              <option value="card">Credit/Debit Card</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          <div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 text-white rounded">
              {loading ? "Placing order..." : `Pay $${total.toFixed(2)}`}
            </button>
          </div>
        </form>

        <aside className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={(item._id ?? item.id)} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={item.image ?? '/assets/placeholder-rect.png'} alt={item.title || item.name} className="w-14 h-14 object-cover rounded" />
                  <div>
                    <div className="text-sm">{item.title ?? item.name}</div>
                    <div className="text-xs text-gray-500">Qty: {item.qty ?? item.quantity ?? 1}</div>
                  </div>
                </div>
                <div className="font-semibold">${((Number(item.price ?? 0)) * (item.qty ?? item.quantity ?? 1)).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between text-sm text-gray-600"><div>Subtotal</div><div>${subtotal.toFixed(2)}</div></div>
            <div className="flex justify-between text-sm text-gray-600"><div>Shipping</div><div>${shipping.toFixed(2)}</div></div>
            <div className="flex justify-between text-lg font-semibold mt-3"><div>Total</div><div>${total.toFixed(2)}</div></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
