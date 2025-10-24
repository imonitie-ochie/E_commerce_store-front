// context/StoreContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);

  // Fetch API data
useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await fetch("https://fakestoreapi.com/products");

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Fetch error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, []);


  // Add to cart function
  const addToCart = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setCart((prev) => [...prev, product]);
      return { success: true, message: `${product.title} added to cart!` };
    }
    return { success: false, message: "Product not found." };
  };

  return (
    <ProductContext.Provider value={{ products, loading, error, addToCart, cart }}>
      {children}
    </ProductContext.Provider>
  );
};
