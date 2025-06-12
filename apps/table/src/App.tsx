import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Cart from "./components/Cart";
import AuthGuard from "./components/AuthGuard";
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
      tableNumber={UI_CONFIG.TABLE_NUMBER}
      isSubmitting={isSubmitting}
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
    // 注文履歴画面
    else if (currentPath.includes("/order-confirmation")) {
      setHeaderTitle("注文履歴");
      setShowBackButton(false);
    }
    // ホーム画面
    else {
      setHeaderTitle(null);
      setShowBackButton(false);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      {/* ログインページ以外でヘッダーを表示 */}
      {location.pathname !== '/store-login' && (
        <Header
          tableNumber={UI_CONFIG.TABLE_NUMBER}
          showBackButton={showBackButton}
          title={headerTitle || undefined}
        />
      )}
      <main className={`flex-grow flex flex-col items-center justify-start p-4 fade-in ${
        location.pathname !== '/store-login' ? 'pt-20' : 'pt-0'
      }`}>
        {children}
      </main>
      {/* ログインページ以外でカートを表示 */}
      {location.pathname !== '/store-login' && <CartContainer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <CartProvider>
          <AuthGuard>
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
          </AuthGuard>
        </CartProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
