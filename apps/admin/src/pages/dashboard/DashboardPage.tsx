import { Card } from "@table-order-system/ui";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">ダッシュボード</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card
          title="メニュー管理"
          description="メニューの追加、編集、カテゴリの管理などを行います。"
          buttonLabel="メニュー管理へ"
          isClickable={true}
          onClick={() => handleNavigation(getPath.menu())}
        />

        <Card
          title="スタッフ管理"
          description="スタッフの追加、編集、権限設定などを行います。"
          buttonLabel="スタッフ管理へ"
          isClickable={true}
          onClick={() => handleNavigation(getPath.staff())}
        />

        <Card
          title="テーブル設定"
          description="店舗内テーブル登録などを行います。"
          buttonLabel="テーブル設定へ"
          isClickable={true}
          onClick={() => handleNavigation(getPath.tables())}
        />

        {/* <Card
          title="売上レポート"
          description="日次、月次の売上データを確認できます。"
          buttonLabel="レポート表示"
          isClickable={true}
          onClick={() => handleNavigation(getPath.reports())}
        />

        <Card
          title="システム設定"
          description="店舗情報、税率設定、営業時間設定などを行います。"
          buttonLabel="設定画面へ"
          buttonVariant="secondary"
          isClickable={true}
          onClick={() => handleNavigation(getPath.settings())}
        /> */}
      </div>
    </div>
  );
};

export default DashboardPage;
