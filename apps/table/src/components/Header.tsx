import React, { useState, useEffect, useRef } from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { UI_CONFIG } from "../config";
import { logout } from "../utils/authUtils";

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
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = () => {
    if (confirm('ログアウトして別のテーブルに変更しますか？\n※カートの内容は現在のテーブル専用として保存されます。')) {
      logout();
      navigate('/store-login', { replace: true });
    }
    setShowLogoutMenu(false);
  };

  const handleTableMenuClick = () => {
    setShowLogoutMenu(!showLogoutMenu);
  };

  // 外側クリック時にメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLogoutMenu(false);
      }
    };

    if (showLogoutMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutMenu]);

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

        {/* Right Section - Order History, Cart and Table Info */}
        <div className="flex items-center space-x-2">

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

          {/* Store and Table Info with Logout Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleTableMenuClick}
              className="bg-orange-50 text-orange-700 px-3 py-2 rounded-lg font-semibold text-sm border border-orange-200 hover:bg-orange-100 transition-colors duration-200 hidden sm:flex items-center space-x-1"
            >
              <span>店舗{UI_CONFIG.STORE_ID} - テーブル{tableNumber}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button
              onClick={handleTableMenuClick}
              className="bg-orange-50 text-orange-700 px-2 py-2 rounded-lg font-semibold text-sm border border-orange-200 hover:bg-orange-100 transition-colors duration-200 sm:hidden flex items-center space-x-1"
            >
              <span>S{UI_CONFIG.STORE_ID}・T{tableNumber}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Logout Dropdown Menu */}
            {showLogoutMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                    現在: テーブル{tableNumber}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>テーブル変更</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
