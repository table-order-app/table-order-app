import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { CartItem, MenuItem, Option, Topping } from "../types";
import { BUSINESS_CONFIG, UI_CONFIG } from "../config";

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

      // 成功メッセージとカートを開く
      setTimeout(() => {
        setIsCartOpen(true);
      }, UI_CONFIG.CART_ANIMATION_DURATION);
    },
    []
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
  const removeCartItem = useCallback((index: number) => {
    setCartItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems.splice(index, 1);
      return updatedItems;
    });
  }, []);

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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
