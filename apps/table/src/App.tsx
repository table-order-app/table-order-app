import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./App.css";
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Cart from "./components/Cart";
import { CartProvider, useCart } from "./contexts/CartContext";
import { ToastProvider } from "./contexts/ToastContext";
import { routeConfig } from "./routes";
import { UI_CONFIG } from "./config";

// CartコンポーネントのラッパーContainer
const CartContainer: React.FC = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
  } = useCart();

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const handleConfirmOrder = () => {
    // 注文確定処理
    alert("注文を確定しました。ありがとうございます！");
    // カートをクリアして閉じる
    clearCart();
    setIsCartOpen(false);
  };

  // カートが表示されていない場合は何も表示しない
  if (!isCartOpen) return null;

  return (
    <Cart
      cartItems={cartItems}
      onClose={handleCloseCart}
      onUpdateQuantity={updateCartItemQuantity}
      onRemoveItem={removeCartItem}
      onOrder={handleConfirmOrder}
      tableNumber={UI_CONFIG.TABLE_NUMBER}
    />
  );
};

// メインレイアウトコンポーネント
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [headerTitle, setHeaderTitle] = useState<string | null>(null);
  const [showBackButton, setShowBackButton] = useState(false);

  // パスに基づいてヘッダー表示を設定
  useEffect(() => {
    const currentPath = location.pathname;
    // メニュー一覧画面
    if (currentPath.includes("/categories/")) {
      setHeaderTitle("メニュー");
      setShowBackButton(true);
    }
    // メニュー詳細画面
    else if (currentPath.includes("/menu/")) {
      setHeaderTitle("メニュー詳細");
      setShowBackButton(true);
    }
    // ホーム画面
    else {
      setHeaderTitle(null);
      setShowBackButton(false);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-[#fffafa] flex flex-col">
      <Header
        tableNumber={UI_CONFIG.TABLE_NUMBER}
        showBackButton={showBackButton}
        title={headerTitle || undefined}
      />
      <main className="flex-grow flex flex-col items-center justify-start pt-20 p-4 fade-in">
        {children}
      </main>
      <CartContainer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <CartProvider>
          <Routes>
            {routeConfig.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <Layout>
                    <route.component />
                  </Layout>
                }
              />
            ))}
          </Routes>
        </CartProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
