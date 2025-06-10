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
import AppInitializer from "./components/AppInitializer";
import { CartProvider, useCart } from "./contexts/CartContext";
import { ToastProvider } from "./contexts/ToastContext";
import { routeConfig } from "./routes";
import { AppConfig } from "./services/configService";

// CartコンポーネントのラッパーContainer
const CartContainer: React.FC<{ config: AppConfig }> = ({ config }) => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateCartItemQuantity,
    removeCartItem,
    submitOrder,
    isSubmitting,
  } = useCart();

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const handleConfirmOrder = async () => {
    // 注文確定処理
    const success = await submitOrder();
    if (success) {
      // カートをクリアして閉じる（submitOrder内で既にclearCartが呼ばれている）
      setIsCartOpen(false);
    }
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
      tableNumber={config.tableNumber}
      isSubmitting={isSubmitting}
    />
  );
};

// メインレイアウトコンポーネント
const Layout: React.FC<{ children: React.ReactNode; config: AppConfig }> = ({ children, config }) => {
  const location = useLocation();
  const [headerTitle, setHeaderTitle] = useState<string | null>(null);
  const [showBackButton, setShowBackButton] = useState(false);

  // パスに基づいてヘッダー表示を設定
  useEffect(() => {
    const currentPath = location.pathname;
    // メニュー一覧画面
    if (currentPath.includes("/menus/")) {
      setHeaderTitle("メニュー");
      setShowBackButton(true);
    }
    // カテゴリ画面
    else if (currentPath.includes("/categories")) {
      setHeaderTitle("カテゴリ");
      setShowBackButton(true);
    }
    // メニュー詳細画面
    else if (currentPath.includes("/menu-detail/")) {
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
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <Header
        tableNumber={config.tableNumber}
        showBackButton={showBackButton}
        title={headerTitle || undefined}
      />
      <main className="flex-grow flex flex-col items-center justify-start pt-20 p-4 fade-in">
        {children}
      </main>
      <CartContainer config={config} />
    </div>
  );
};

function App() {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  const handleConfigReady = (config: AppConfig) => {
    setAppConfig(config);
  };

  return (
    <Router>
      <ToastProvider>
        <AppInitializer onConfigReady={handleConfigReady}>
          {appConfig && (
            <CartProvider>
              <Routes>
                {routeConfig.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <Layout config={appConfig}>
                        <route.component />
                      </Layout>
                    }
                  />
                ))}
              </Routes>
            </CartProvider>
          )}
        </AppInitializer>
      </ToastProvider>
    </Router>
  );
}

export default App;
