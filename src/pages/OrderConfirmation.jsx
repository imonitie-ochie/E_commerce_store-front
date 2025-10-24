// src/pages/OrderConfirmation.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function OrderConfirmation() {
  const location = useLocation();
  const orderId = location.state?.orderId ?? null;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow text-center">
      <h1 className="text-2xl font-semibold mb-4">Thank you — your order is on its way!</h1>
      {orderId ? (
        <p className="text-gray-700 mb-4">Order ID: <span className="font-mono">{orderId}</span></p>
      ) : (
        <p className="text-gray-700 mb-4">We received your order and will process it shortly.</p>
      )}
      <div className="flex justify-center gap-3">
        <Link to="/account" className="px-4 py-2 border rounded">View account</Link>
        <Link to="/" className="px-4 py-2 bg-black text-white rounded">Continue shopping</Link>
      </div>
    </div>
  );
}
