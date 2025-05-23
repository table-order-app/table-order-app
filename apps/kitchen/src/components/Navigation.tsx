import { useNavigate, useLocation } from "react-router-dom";
import { getPath } from "../routes";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white shadow z-10">
      <h1 className="text-2xl font-bold">キッチンモニター</h1>
      <div className="flex space-x-4">
        <button
          onClick={() => navigate(getPath.dashboard())}
          className={`px-4 py-2 rounded-lg transition-colors ${
            isActive(getPath.dashboard())
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          注文一覧
        </button>
        <button
          onClick={() => navigate(getPath.progress())}
          className={`px-4 py-2 rounded-lg transition-colors ${
            isActive(getPath.progress())
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          進捗状況
        </button>
        <button
          onClick={() => navigate(getPath.history())}
          className={`px-4 py-2 rounded-lg transition-colors ${
            isActive(getPath.history())
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          履歴
        </button>
      </div>
    </div>
  );
};

export default Navigation;
