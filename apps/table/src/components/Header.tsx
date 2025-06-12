import React, { useState } from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { UI_CONFIG } from "../config";

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

        {/* Right Section - Settings, Order History, Cart and Table Info */}
        <div className="flex items-center space-x-2">
          {/* Settings Button */}
          <button
            onClick={() => navigate("/store-login")}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Order History Button */}
          <button
            onClick={() => navigate("/order-confirmation")}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </button>

          {/* Cart Button */}
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

          {/* Store and Table Info */}
          <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded-lg font-semibold text-sm border border-orange-200 hidden sm:block">
            店舗{UI_CONFIG.STORE_ID} - テーブル{tableNumber}
          </div>
          <div className="bg-orange-50 text-orange-700 px-2 py-2 rounded-lg font-semibold text-sm border border-orange-200 sm:hidden">
            S{UI_CONFIG.STORE_ID}・T{tableNumber}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
