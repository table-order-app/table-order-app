import React from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

interface HeaderProps {
  tableNumber: string;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({
  tableNumber,
  showBackButton = false,
  onBack,
  title,
}) => {
  const navigate = useNavigate();
  const { cartItems, setIsCartOpen } = useCart();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#e0815e] text-white p-3 shadow-md z-30 flex items-center">
      {showBackButton ? (
        <button onClick={handleBack} className="text-white mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      ) : (
        <div className="w-5 mr-2"></div>
      )}

      <div className="flex-1 flex justify-center items-center">
        {title ? (
          <h1 className="text-lg font-medium">{title}</h1>
        ) : (
          <Logo className="w-10 h-10" />
        )}
      </div>

      <div className="flex items-center">
        <button
          onClick={handleOpenCart}
          className="relative p-1 text-white hover:text-white/80 transition-colors mr-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {cartItems.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-[#e0815e] transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full">
              {cartItems.length}
            </span>
          )}
        </button>

        <div className="bg-white text-[#e0815e] px-3 py-1 rounded-md font-bold shadow">
          テーブル: {tableNumber}
        </div>
      </div>
    </header>
  );
};

export default Header;
