// src/pages/Account.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../Services/api";

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/orders/my").catch(async () => {
          // fallback if backend doesn't have /orders/my
          const all = await api.get("/orders");
          return { data: (all.data || []).filter(o => (o.userId === user._id || o.userId === user.id || (o.user && (o.user._id === user._id)))) };
        });
        setOrders(res.data || []);
      } catch (e) {
        console.error("failed to load orders", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return <div className="text-center py-16">Please sign in to view your account.</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">Profile</h2>
        <div className="mt-2 text-sm text-gray-700">Name: {user.name || "-"}</div>
        <div className="mt-1 text-sm text-gray-700">Email: {user.email || "-"}</div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Orders</h3>
        {loading ? <div>Loading...</div> : (
          orders.length ? (
            <div className="space-y-2">
              {orders.map(o => (
                <div key={o._id || o.id} className="p-3 border rounded">
                  <div className="text-sm text-gray-700">Order {o._id || o.id} — {o.status || "pending"}</div>
                  <div className="text-sm text-gray-500">Items: {o.items?.length || 0}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-gray-500">No orders yet.</div>
        )}
      </div>
    </div>
  );
}
