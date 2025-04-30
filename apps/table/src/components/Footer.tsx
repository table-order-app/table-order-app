import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#e0815e] text-white text-center p-4 text-sm">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} テーブルオーダーシステム</p>
        <p className="text-xs mt-1 text-white opacity-80">
          安全・便利なお食事体験をご提供します
        </p>
      </div>
    </footer>
  );
};

export default Footer;
