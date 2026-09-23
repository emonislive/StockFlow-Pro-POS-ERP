'use client';

import React, { createContext, useContext, useState } from 'react';

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  cost_price: string | number;
  selling_price: string | number;
  stock_quantity: number;
  unit: string;
  description?: string;
  is_active: boolean;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_due: string | number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (discount: number) => void;
  addToCart: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState<number>(0);

  const addToCart = (product: Product, quantity: number = 1): boolean => {
    const existingIndex = items.findIndex((item) => item.product.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? items[existingIndex].quantity : 0;
    const requestedTotal = currentQtyInCart + quantity;

    if (requestedTotal > product.stock_quantity) {
      alert(`Cannot add more than available stock (${product.stock_quantity} available).`);
      return false;
    }

    const price = Number(product.selling_price);

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity = requestedTotal;
      updated[existingIndex].subtotal = requestedTotal * price;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product,
          quantity,
          unit_price: price,
          subtotal: quantity * price,
        },
      ]);
    }
    return true;
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (quantity > item.product.stock_quantity) {
            alert(`Stock limit reached for ${item.product.name} (Max: ${item.product.stock_quantity})`);
            return item;
          }
          return {
            ...item,
            quantity,
            subtotal: quantity * item.unit_price,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setCustomer(null);
    setDiscount(0);
  };

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        customer,
        discount,
        setCustomer,
        setDiscount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
