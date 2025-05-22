import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      <div className="flex-1 overflow-auto">{children}</div>

      <footer className="py-2 px-4 text-center text-xs text-gray-500 bg-white border-t border-gray-200">
        <p>© 2023 TableOrder - スタッフアプリ v1.0</p>
      </footer>
    </div>
  );
};

export default MainLayout;
