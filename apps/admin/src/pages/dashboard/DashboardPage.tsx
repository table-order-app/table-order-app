import { useNavigate } from "react-router-dom";
import { getPath } from "../../routes";

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const dashboardCards = [
    {
      title: "メニュー管理",
      description: "メニューの追加、編集、カテゴリの管理などを行います。",
      buttonLabel: "メニュー管理へ",
      path: getPath.menu(),
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      title: "スタッフ管理",
      description: "スタッフの追加、編集、権限設定などを行います。",
      buttonLabel: "スタッフ管理へ",
      path: getPath.staff(),
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      title: "テーブル設定",
      description: "店舗内テーブル登録などを行います。",
      buttonLabel: "テーブル設定へ",
      path: getPath.tables(),
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">ダッシュボード</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 h-64 flex flex-col"
          >
            {/* カードコンテンツ */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 p-3 rounded-lg mr-4">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
              </div>
              
              <p className="text-gray-600 leading-relaxed text-sm flex-1">
                {card.description}
              </p>
              
              <button
                onClick={() => handleNavigation(card.path)}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2.5 px-4 rounded-md font-medium transition-colors duration-200 text-sm mt-4"
              >
                {card.buttonLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
