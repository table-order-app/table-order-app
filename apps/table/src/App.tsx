import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CategorySelection from "./components/CategorySelection";
import MenuList from "./components/MenuList";
import MenuDetail from "./components/MenuDetail";
import Cart from "./components/Cart";
import { CartItem, MenuItem, Option, Topping } from "./types";

// 画面の状態を表す型
type AppScreen = "home" | "category" | "menu" | "menu-detail" | "cart";

function App() {
  // モックとしてテーブル番号を固定値とします
  const tableNumber = "test";
  // 現在表示している画面の状態
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home");
  // 選択されたカテゴリID (メニュー表示機能で使用)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  // 選択されたメニューID (メニュー詳細画面で使用)
  const [selectedMenuId, setSelectedMenuId] = useState<number>(0);
  // カートアイテム
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // カートの表示状態
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // ホーム画面から注文開始ボタンが押された時
  const handleStartOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // カテゴリ選択画面に遷移
    setCurrentScreen("category");
  };

  // カテゴリが選択された時
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    // メニュー画面に遷移
    setCurrentScreen("menu");
  };

  // メニューが選択された時
  const handleMenuSelect = (menuId: number) => {
    setSelectedMenuId(menuId);
    // メニュー詳細画面に遷移
    setCurrentScreen("menu-detail");
  };

  // カートを開く
  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  // カートを閉じる
  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  // カートに追加された時
  const handleAddToCart = (
    menuItem: MenuItem,
    options: Option[],
    toppings: Topping[],
    notes: string,
    quantity: number
  ) => {
    // カートに新しいアイテムを追加
    const newCartItem: CartItem = {
      menuItem,
      options,
      toppings,
      notes,
      quantity, // MenuDetailから指定された数量を使用
    };

    setCartItems([...cartItems, newCartItem]);

    // メニュー一覧画面に戻る
    setCurrentScreen("menu");

    // 成功メッセージとカートを開く
    setTimeout(() => {
      setIsCartOpen(true);
    }, 300);
  };

  // カート内の商品数量を更新
  const handleUpdateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 10) return;

    const updatedCartItems = [...cartItems];
    updatedCartItems[index].quantity = newQuantity;
    setCartItems(updatedCartItems);
  };

  // カートから商品を削除
  const handleRemoveCartItem = (index: number) => {
    const updatedCartItems = [...cartItems];
    updatedCartItems.splice(index, 1);
    setCartItems(updatedCartItems);
  };

  // 注文確定処理
  const handleConfirmOrder = () => {
    // TODO: 本来はここでサーバーに注文を送信する処理を実装
    alert("注文を確定しました。ありがとうございます！");
    // 注文確定後、カートをクリアしてカートを閉じる
    setCartItems([]);
    setIsCartOpen(false);
    // ホーム画面に戻る
    setCurrentScreen("home");
  };

  // 戻るボタンがクリックされた時
  const handleBack = () => {
    if (currentScreen === "category") {
      setCurrentScreen("home");
    } else if (currentScreen === "menu") {
      setCurrentScreen("category");
    } else if (currentScreen === "menu-detail") {
      setCurrentScreen("menu");
    }
  };

  // 現在の画面に応じてコンテンツを切り替え
  const renderContent = () => {
    switch (currentScreen) {
      case "home":
        return (
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-center mb-6">ようこそ</h2>

            <p className="text-gray-600 mb-6 text-center">
              注文を始めるボタンを押して、お食事の注文を始めましょう
            </p>

            <form onSubmit={handleStartOrder} className="space-y-4">
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="w-64 bg-[#e0815e] text-white py-2 px-4 rounded-md hover:bg-[#d3704f] transition duration-200"
                >
                  注文を始める
                </button>
              </div>
            </form>
          </div>
        );

      case "category":
        return (
          <CategorySelection
            onSelectCategory={handleCategorySelect}
            onBack={handleBack}
          />
        );

      case "menu":
        return (
          <MenuList
            initialCategoryId={selectedCategoryId}
            onBack={handleBack}
            onSelectMenu={handleMenuSelect}
            onOpenCart={handleOpenCart}
            cartItemCount={cartItems.length}
          />
        );

      case "menu-detail":
        return (
          <MenuDetail
            menuId={selectedMenuId}
            onBack={handleBack}
            onAddToCart={handleAddToCart}
          />
        );

      default:
        return <div>エラー: 不明な画面です</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fffafa] flex flex-col">
      <Header tableNumber={tableNumber} />

      <main className="flex-grow flex flex-col items-center justify-center p-4 fade-in">
        {renderContent()}
      </main>

      <Footer />

      {/* カート表示（モーダル） */}
      {isCartOpen && (
        <Cart
          cartItems={cartItems}
          onClose={handleCloseCart}
          onUpdateQuantity={handleUpdateCartItemQuantity}
          onRemoveItem={handleRemoveCartItem}
          onOrder={handleConfirmOrder}
          tableNumber={tableNumber}
        />
      )}
    </div>
  );
}

export default App;
