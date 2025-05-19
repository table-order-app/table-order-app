import { Button } from "@table-order-system/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";

// テーブルの型定義
type Table = {
  id: string;
  number: number;
  capacity: number;
  area: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
  qrCode?: string;
};

// エリアの型定義
type Area = {
  id: string;
  name: string;
};

const TablesPage = () => {
  const navigate = useNavigate();

  // サンプルエリアデータ
  const [areas] = useState<Area[]>([
    { id: "area1", name: "メインフロア" },
    { id: "area2", name: "テラス" },
    { id: "area3", name: "個室" },
    { id: "area4", name: "カウンター" },
  ]);

  // サンプルテーブルデータ
  const [tables] = useState<Table[]>([
    {
      id: "table1",
      number: 1,
      capacity: 4,
      area: "area1",
      status: "available",
      qrCode: "https://example.com/qr/table1",
    },
    {
      id: "table2",
      number: 2,
      capacity: 2,
      area: "area1",
      status: "occupied",
      qrCode: "https://example.com/qr/table2",
    },
    {
      id: "table3",
      number: 3,
      capacity: 6,
      area: "area2",
      status: "available",
      qrCode: "https://example.com/qr/table3",
    },
    {
      id: "table4",
      number: 101,
      capacity: 8,
      area: "area3",
      status: "reserved",
      qrCode: "https://example.com/qr/table4",
    },
    {
      id: "table5",
      number: 201,
      capacity: 1,
      area: "area4",
      status: "maintenance",
      qrCode: "https://example.com/qr/table5",
    },
  ]);

  // 選択中のエリア
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // フィルタリングされたテーブルリスト
  const filteredTables = selectedArea
    ? tables.filter((table) => table.area === selectedArea)
    : tables;

  // エリア名を取得する関数
  const getAreaName = (areaId: string) => {
    const area = areas.find((a) => a.id === areaId);
    return area ? area.name : "不明なエリア";
  };

  // ステータスの日本語表示を取得する関数
  const getStatusDisplay = (status: Table["status"]) => {
    const statusMap = {
      available: "利用可能",
      occupied: "使用中",
      reserved: "予約済み",
      maintenance: "メンテナンス中",
    };
    return statusMap[status];
  };

  // ステータスの色を取得する関数
  const getStatusColor = (status: Table["status"]) => {
    const colorMap = {
      available: "bg-green-100 text-green-800",
      occupied: "bg-red-100 text-red-800",
      reserved: "bg-yellow-100 text-yellow-800",
      maintenance: "bg-gray-100 text-gray-800",
    };
    return colorMap[status];
  };

  // ダッシュボードに戻る
  const handleBack = () => {
    navigate(getPath.dashboard());
  };

  // QRコードの生成または表示
  const handleShowQR = (tableId: string) => {
    alert(`QRコードを表示: ${tableId}`);
    // 実際の実装ではモーダルウィンドウなどでQRコードを表示する
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">テーブル設定</h2>
        <Button
          label="ダッシュボードに戻る"
          variant="secondary"
          onClick={handleBack}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">エリア別フィルター</h3>
          <Button label="エリア追加" variant="secondary" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-full ${
              selectedArea === null
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setSelectedArea(null)}
          >
            すべて
          </button>

          {areas.map((area) => (
            <button
              key={area.id}
              className={`px-4 py-2 rounded-full ${
                selectedArea === area.id
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setSelectedArea(area.id)}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">テーブル一覧</h3>
          <Button label="テーブル追加" />
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  テーブル番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  収容人数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  エリア
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QRコード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTables.length > 0 ? (
                filteredTables.map((table) => (
                  <tr key={table.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {table.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {table.capacity}人
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getAreaName(table.area)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          table.status
                        )}`}
                      >
                        {getStatusDisplay(table.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleShowQR(table.id)}
                      >
                        QRコード表示
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary hover:text-primary-dark mr-3">
                        編集
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    表示するテーブルがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-lg mb-2">テーブル状態の説明</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                利用可能
              </span>
              <span className="text-sm text-gray-700">注文可能な状態</span>
            </div>
            <div className="flex items-center">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 mr-2">
                使用中
              </span>
              <span className="text-sm text-gray-700">現在お客様が利用中</span>
            </div>
            <div className="flex items-center">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">
                予約済み
              </span>
              <span className="text-sm text-gray-700">
                予約が入っている状態
              </span>
            </div>
            <div className="flex items-center">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                メンテナンス中
              </span>
              <span className="text-sm text-gray-700">使用不可の状態</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablesPage;
