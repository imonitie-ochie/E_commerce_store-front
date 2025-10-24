import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <h4 className="font-semibold mb-2">ShopX</h4>
          <p className="text-sm text-gray-600">Quality products delivered fast. Follow us on social for deals.</p>
          <div className="flex gap-2 mt-3">
            <a className="text-sm text-gray-500">Twitter</a>
            <a className="text-sm text-gray-500">Instagram</a>
            <a className="text-sm text-gray-500">Facebook</a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Company</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Support</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Email: support@shopx.example</li>
            <li>Help Center</li>
            <li>Shipping</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Subscribe</h4>
          <p className="text-sm text-gray-600 mb-2">Get updates about new products and offers.</p>
          <form className="flex">
            <input placeholder="Email" className="flex-1 p-2 border rounded-l" />
            <button className="px-3 bg-black text-white rounded-r">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="bg-gray-50 border-t">
        <div className="container mx-auto px-4 py-4 text-sm text-gray-500 text-center">
          &copy; {new Date().getFullYear()} ShopX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
