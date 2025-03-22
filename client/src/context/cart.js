import React from "react"
import { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const CartContext = createContext();
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCartDB = async (productId) => {
    try {
      const authData = localStorage.getItem("auth");
      
      const parsed = JSON.parse(authData);  
      const userId = parsed?.user?._id;

      await axios.post("/api/v1/cart/add-item", {
        userId,
        productId,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeFromCartDB = async (productId) => {
    try {
      const authData = localStorage.getItem("auth");
      
      const parsed = JSON.parse(authData);  
      const userId = parsed?.user?._id;

      await axios.post("/api/v1/cart/remove-item", {
        userId,
        productId,
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  useEffect(() => {
    let existingCartItem = localStorage.getItem("cart");
    if (existingCartItem) setCart(JSON.parse(existingCartItem));
  }, []);

  return (
    <CartContext.Provider value={[cart, setCart, addToCartDB, removeFromCartDB]}>
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };
