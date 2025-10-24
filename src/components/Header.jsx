import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useStore } from "../contexts/StoreContext";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { cart, wishlist } = useStore();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* left: brand + nav toggle */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            aria-label="open menu"
            onClick={() => setOpen((s) => !s)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  open
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>

          <Link to="/" className="text-2xl font-bold">
            ShopX
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "text-black font-semibold" : "text-gray-600"
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/category"
              className={({ isActive }) =>
                isActive ? "text-black font-semibold" : "text-gray-600"
              }
            >
              Shop
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? "text-black font-semibold" : "text-gray-600"
              }
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive ? "text-black font-semibold" : "text-gray-600"
              }
            >
              Contact
            </NavLink>
          </nav>
        </div>

        {/* center: search (desktop)
        <div className="hidden sm:flex flex-1 justify-center px-4">
          <form className="w-full max-w-2xl">
            <label htmlFor="search" className="sr-only">
              Search products
            </label>
            <input
              id="search"
              type="search"
              placeholder="Search products, categories..."
              className="w-full border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
        </div> */}

        {/* right: actions */}
        <div className="flex items-center gap-3">
          {/* <Link
            to="/wishlist"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-gray-700"
          >
            ♥ <span className="ml-1">{wishlist.length}</span>
          </Link> */}
          <Link
            to="/cart"
            className="inline-flex items-center gap-1 text-sm text-gray-700"
          >
            🛒 <span className="ml-1">{cart.reduce((s, i) => s + i.qty, 0)}</span>
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              {/* Account button with white bg and black border as requested */}
              <Link
                to="/account"
                className="text-sm bg-white border border-black text-black px-3 py-1 rounded"
              >
                {user.name || user.email}
              </Link>

              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-sm text-white bg-indigo-600 px-3 py-1 rounded"
                >
                  Admin
                </Link>
              )}

              <button onClick={logout} className="text-sm text-red-500">
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Link to="/signin" className="text-sm">
                Sign in
              </Link>
              {/* Sign up removed as requested */}
            </div>
          )}
        </div>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setOpen(false)} className="block">
              Home
            </Link>
            <Link
              to="/category/"
              onClick={() => setOpen(false)}
              className="block"
            >
              Shop
            </Link>
            <Link to="/about" onClick={() => setOpen(false)} className="block">
              About
            </Link>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="block"
            >
              Contact
            </Link>
            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="block"
              >
                Cart ({cart.reduce((s, i) => s + i.qty, 0)})
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setOpen(false)}
                className="block"
              >
                Wishlist ({wishlist.length})
              </Link>
            </div>
            <div className="pt-2">
              {user ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setOpen(false)}
                    className="block bg-white border border-black text-black px-3 py-1 rounded w-max"
                  >
                    {user.name || user.email}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="mt-2 border-2 border-black text-red-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    onClick={() => setOpen(false)}
                    className="block  "
                  >
                    Sign in
                  </Link>
                  {/* Sign up removed from mobile as well */}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
