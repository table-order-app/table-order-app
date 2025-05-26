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
    <header className="fixed top-0 left-0 right-0 bg-white text-gray-800 px-4 py-3 shadow-md z-30 border-b border-gray-200">
      <div className="flex items-center justify-between w-full">
        {/* Left Section - Back Button */}
        <div className="flex items-center min-w-0">
          {showBackButton ? (
            <button 
              onClick={handleBack} 
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors duration-200 mr-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-orange-600"
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
            <div className="w-10 mr-3"></div>
          )}
        </div>

        {/* Center Section - Logo/Title */}
        <div className="flex-1 flex justify-center items-center">
          {title ? (
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          ) : (
            <div className="flex items-center space-x-2">
              <Logo className="w-12 h-12" />
              <span className="text-lg font-semibold hidden sm:block text-gray-700">Table Order</span>
            </div>
          )}
        </div>

        {/* Right Section - Cart and Table Info */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenCart}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-orange-600"
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
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-500 rounded-full shadow-sm">
                {cartItems.length}
              </span>
            )}
          </button>

          <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-semibold text-sm border border-orange-200 hidden sm:block">
            テーブル {tableNumber}
          </div>
          <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded-lg font-semibold text-sm border border-orange-200 sm:hidden">
            T{tableNumber}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
