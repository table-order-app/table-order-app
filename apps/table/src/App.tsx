import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CategorySelection from "./components/CategorySelection";

// 画面の状態を表す型
type AppScreen = "home" | "category" | "menu";

function App() {
  // モックとしてテーブル番号を固定値とします
  const tableNumber = "test";
  // 現在表示している画面の状態
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home");
  // 選択されたカテゴリID (今後のメニュー表示機能のために保持)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  // ホーム画面から注文開始ボタンが押された時
  const handleStartOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // カテゴリ選択画面に遷移
    setCurrentScreen("category");
  };

  // カテゴリが選択された時
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    // 将来的にはメニュー画面に遷移する
    console.log(`カテゴリID: ${categoryId} が選択されました`);
    // TODO: 選択されたカテゴリIDを使用してメニュー一覧を表示する機能を今後実装
    // setCurrentScreen("menu");
  };

  // 戻るボタンがクリックされた時
  const handleBack = () => {
    if (currentScreen === "category") {
      setCurrentScreen("home");
    } else if (currentScreen === "menu") {
      setCurrentScreen("category");
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
    </div>
  );
}

export default App;
