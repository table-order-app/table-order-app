import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { CartItem, MenuItem, Option, Topping } from "../types";
import { BUSINESS_CONFIG, UI_CONFIG } from "../config";
import { useToast } from "./ToastContext";
import { getPath } from "../routes";

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
  getTotalPrice: () => number;
  getTotalItemCount: () => number;
  submitOrder: () => Promise<boolean>;
  isSubmitting: boolean;
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
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // カートに商品を追加
  const addToCart = useCallback(
    (
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

      setCartItems((prevItems) => [...prevItems, newCartItem]);

      // トースト通知を表示
      showToast(`${menuItem.name}をカートに追加しました`, "success");
    },
    [showToast]
  );

  // カート内の商品数量を更新
  const updateCartItemQuantity = useCallback(
    (index: number, newQuantity: number) => {
      if (
        newQuantity < BUSINESS_CONFIG.MIN_MENU_QUANTITY ||
        newQuantity > BUSINESS_CONFIG.MAX_MENU_QUANTITY
      )
        return;

      setCartItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].quantity = newQuantity;
        return updatedItems;
      });
    },
    []
  );

  // カートから商品を削除
  const removeCartItem = useCallback(
    (index: number) => {
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems];
        const removedItem = updatedItems[index];
        updatedItems.splice(index, 1);

        // 削除時のトースト通知
        if (removedItem) {
          showToast(
            `${removedItem.menuItem.name}をカートから削除しました`,
            "info"
          );
        }

        return updatedItems;
      });
    },
    [showToast]
  );

  // カートをクリア
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // カート内の合計金額を計算
  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => {
      // 商品の基本価格
      let itemPrice = item.menuItem.price;

      // オプションの価格を追加
      item.options.forEach((option) => {
        itemPrice += option.price;
      });

      // トッピングの価格を追加
      item.toppings.forEach((topping) => {
        itemPrice += topping.price;
      });

      // 数量をかける
      return total + itemPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  // カート内の合計商品数を計算
  const getTotalItemCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const submitOrder = useCallback(async () => {
    if (cartItems.length === 0) return false;

    setIsSubmitting(true);
    try {
      const { createOrder } = await import("../services/orderService");
      const tableId = parseInt(UI_CONFIG.TABLE_NUMBER) || 2; // テーブル2を使用（実在するテーブル）

      console.log("Submitting order with:");
      console.log("- tableId:", tableId);
      console.log("- cartItems:", cartItems);

      const response = await createOrder(tableId, cartItems);

      console.log("API Response:", response);

      if (response.success) {
        showToast("注文を確定しました。ありがとうございます！", "success");
        clearCart();
        navigate(getPath.orderConfirmation());
        return true;
      } else {
        showToast(`注文の確定に失敗しました: ${response.error}`, "error");
        return false;
      }
    } catch (error) {
      showToast("注文の確定に失敗しました。", "error");
      console.error("Order submission error:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [cartItems, clearCart, showToast, navigate]);

  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    getTotalPrice,
    getTotalItemCount,
    submitOrder,
    isSubmitting,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
