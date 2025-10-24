// src/pages/Contact.jsx
import React, { useState } from "react";
import api from "../services/api";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      // optional: send to backend if you have /contact endpoint
      await api.post("/contact", { name, email, message: msg }).catch(() => null);
      setSent(true);
    } catch (e) {
      alert("Failed to send message");
    }
  };

  if (sent) return <div className="max-w-md mx-auto p-6 bg-white rounded shadow">Thanks — we received your message.</div>;

  return (
    <form onSubmit={submit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Contact us</h2>
      <input className="w-full border p-2 mb-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="w-full border p-2 mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <textarea className="w-full border p-2 mb-2" placeholder="Message" value={msg} onChange={e=>setMsg(e.target.value)} />
      <button className="w-full py-2 bg-black text-white rounded">Send</button>
    </form>
  );
}
