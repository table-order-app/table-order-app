import React from "react";
import Logo from "./Logo";

interface HeaderProps {
  tableNumber: string;
}

const Header: React.FC<HeaderProps> = ({ tableNumber }) => {
  return (
    <header className="bg-[#e0815e] text-white p-4 shadow-md relative">
      <div className="container mx-auto flex items-center justify-center">
        <Logo className="w-12 h-12" />
      </div>
      <div className="absolute top-4 right-4 bg-white text-[#e0815e] px-3 py-1 rounded-md font-bold shadow">
        テーブル: {tableNumber}
      </div>
    </header>
  );
};

export default Header;
