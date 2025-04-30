import React, { createContext, useContext, useState, ReactNode } from "react";
import { CartItem, MenuItem, Option, Topping } from "../types";

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (
    menuItem: MenuItem,
    options: Option[],
    toppings: Topping[],
    notes: string,
    quantity: number
  ) => void;
  updateCartItemQuantity: (index: number, newQuantity: number) => void;
  removeCartItem: (index: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
  tableNumber: string;
}

export const CartProvider: React.FC<CartProviderProps> = ({
  children,
  tableNumber,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // カートに商品を追加
  const addToCart = (
    menuItem: MenuItem,
    options: Option[],
    toppings: Topping[],
    notes: string,
    quantity: number
  ) => {
    const newCartItem: CartItem = {
      menuItem,
      options,
      toppings,
      notes,
      quantity,
    };

    setCartItems([...cartItems, newCartItem]);

    // 成功メッセージとカートを開く
    setTimeout(() => {
      setIsCartOpen(true);
    }, 300);
  };

  // カート内の商品数量を更新
  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 10) return;

    const updatedCartItems = [...cartItems];
    updatedCartItems[index].quantity = newQuantity;
    setCartItems(updatedCartItems);
  };

  // カートから商品を削除
  const removeCartItem = (index: number) => {
    const updatedCartItems = [...cartItems];
    updatedCartItems.splice(index, 1);
    setCartItems(updatedCartItems);
  };

  // カートをクリア
  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
