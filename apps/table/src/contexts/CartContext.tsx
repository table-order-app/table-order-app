import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
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
  // テーブル固有のカートキーを生成
  const getCartStorageKey = useCallback(() => {
    const storeCode = localStorage.getItem('accorto_store_code') || 'default';
    const tableNumber = localStorage.getItem('accorto_table_number') || '1';
    const key = `accorto_cart_${storeCode}_table_${tableNumber}`;
    console.log('Cart storage key:', key);
    return key;
  }, []);

  // LocalStorageからカートを読み込み
  const loadCartFromStorage = useCallback(() => {
    try {
      const cartKey = getCartStorageKey();
      const storedCart = localStorage.getItem(cartKey);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      return [];
    }
  }, [getCartStorageKey]);

  // LocalStorageにカートを保存
  const saveCartToStorage = useCallback((items: CartItem[]) => {
    try {
      const cartKey = getCartStorageKey();
      localStorage.setItem(cartKey, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }, [getCartStorageKey]);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // テーブル情報の変更を監視してカートを再読み込み
  useEffect(() => {
    const handleStorageChange = () => {
      const newCartItems = loadCartFromStorage();
      setCartItems(newCartItems);
    };

    // ストレージイベントをリッスン（他のタブでの変更を検知）
    window.addEventListener('storage', handleStorageChange);
    
    // テーブル番号や店舗コードの変更を検知
    const checkForTableChange = () => {
      const currentCart = loadCartFromStorage();
      setCartItems(currentCart);
    };

    // 定期的にチェック（ローカルストレージの直接変更を検知）
    const interval = setInterval(checkForTableChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [loadCartFromStorage]);

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

      setCartItems((prevItems) => {
        const updatedItems = [...prevItems, newCartItem];
        saveCartToStorage(updatedItems);
        return updatedItems;
      });

      // トースト通知を表示
      showToast(`${menuItem.name}をカートに追加しました`, "success");
    },
    [showToast, saveCartToStorage]
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
        saveCartToStorage(updatedItems);
        return updatedItems;
      });
    },
    [saveCartToStorage]
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

        saveCartToStorage(updatedItems);
        return updatedItems;
      });
    },
    [showToast, saveCartToStorage]
  );

  // カートをクリア
  const clearCart = useCallback(() => {
    setCartItems([]);
    saveCartToStorage([]);
  }, [saveCartToStorage]);

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
      // テーブル番号をLocalStorageから動的に取得
      const storeCode = localStorage.getItem('accorto_store_code');
      const tableNumberStr = localStorage.getItem('accorto_table_number') || '1';
      const tableNumber = parseInt(tableNumberStr) || 1;
      
      console.log('=== Order Submission Debug ===');
      console.log('Store code from localStorage:', storeCode);
      console.log('Table number from localStorage:', tableNumberStr);
      console.log('Parsed table number:', tableNumber);
      console.log('Cart items count:', cartItems.length);

      const response = await createOrder(tableNumber, cartItems);

      console.log("API Response:", response);

      if (response.success) {
        console.log('Order submitted successfully:', response.data);
        clearCart();
        // 注文データを状態として渡して注文成功画面に遷移
        navigate(getPath.orderSuccess(), { 
          state: { orderData: response.data },
          replace: true 
        });
        return true;
      } else {
        console.error('Order submission failed:', response.error);
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
