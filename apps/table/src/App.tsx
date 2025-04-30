import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import MenuListPage from "./pages/MenuListPage";
import MenuDetailPage from "./pages/MenuDetailPage";
import Cart from "./components/Cart";
import { CartProvider, useCart } from "./contexts/CartContext";
import { routePatterns } from "./routes";

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
      tableNumber="test" // 実際の運用ではこの値は動的に与えるべき
    />
  );
};

// メインレイアウトコンポーネント
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#fffafa] flex flex-col">
      <Header tableNumber="test" />
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
      <CartProvider tableNumber="test">
        <Routes>
          <Route
            path={routePatterns.home}
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path={routePatterns.categories}
            element={
              <Layout>
                <CategoryPage />
              </Layout>
            }
          />
          <Route
            path={routePatterns.menuList}
            element={
              <Layout>
                <MenuListPage />
              </Layout>
            }
          />
          <Route
            path={routePatterns.menuDetail}
            element={
              <Layout>
                <MenuDetailPage />
              </Layout>
            }
          />
        </Routes>
      </CartProvider>
    </Router>
  );
}

export default App;
