import { Card } from "@table-order-system/ui";

function App() {
  // 各管理機能へのルーティングを処理する関数（将来的にはルーターで実装）
  const handleNavigation = (destination: string) => {
    console.log(`ナビゲーション先: ${destination}`);
    // 実際のルーティングはここに実装
    // 例: router.push(`/admin/${destination}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="w-full py-8">
        <div className="w-full max-w-screen-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            ダッシュボード
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Card
              title="注文管理"
              description="注文の確認、編集、履歴の閲覧などを行います。"
              buttonLabel="注文管理へ"
              isClickable={true}
              onClick={() => handleNavigation("orders")}
            />

            <Card
              title="メニュー管理"
              description="メニューの追加、編集、カテゴリの管理などを行います。"
              buttonLabel="メニュー管理へ"
              isClickable={true}
              onClick={() => handleNavigation("menu")}
            />

            <Card
              title="スタッフ管理"
              description="スタッフの追加、編集、権限設定などを行います。"
              buttonLabel="スタッフ管理へ"
              isClickable={true}
              onClick={() => handleNavigation("staff")}
            />

            <Card
              title="テーブル設定"
              description="店舗内テーブル登録などを行います。"
              buttonLabel="テーブル設定へ"
              isClickable={true}
              onClick={() => handleNavigation("tables")}
            />

            <Card
              title="売上レポート"
              description="日次、月次の売上データを確認できます。"
              buttonLabel="レポート表示"
              isClickable={true}
              onClick={() => handleNavigation("reports")}
            />

            <Card
              title="システム設定"
              description="店舗情報、税率設定、営業時間設定などを行います。"
              buttonLabel="設定画面へ"
              buttonVariant="secondary"
              isClickable={true}
              onClick={() => handleNavigation("settings")}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
