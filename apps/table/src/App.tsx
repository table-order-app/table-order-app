import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
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
  return (
    <div className="min-h-screen bg-[#fffafa] flex flex-col">
      <Header tableNumber={UI_CONFIG.TABLE_NUMBER} />
      <main className="flex-grow flex flex-col items-center justify-center p-4 fade-in">
        {children}
      </main>
      <Footer />
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
