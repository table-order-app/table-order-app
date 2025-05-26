import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  isVisible: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  isVisible,
  onClose,
  autoHideDuration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onClose]);

  if (!isVisible) return null;

  // タイプに応じたスタイルを設定
  const styleConfig = {
    success: {
      bg: "bg-gradient-to-r from-green-500 to-emerald-500",
      border: "border-green-400",
      accent: "bg-green-400"
    },
    error: {
      bg: "bg-gradient-to-r from-red-500 to-pink-500",
      border: "border-red-400",
      accent: "bg-red-400"
    },
    info: {
      bg: "bg-gradient-to-r from-blue-500 to-cyan-500",
      border: "border-blue-400",
      accent: "bg-blue-400"
    },
    warning: {
      bg: "bg-gradient-to-r from-yellow-500 to-orange-500",
      border: "border-yellow-400",
      accent: "bg-yellow-400"
    }
  }[type];

  const icon = {
    success: (
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
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
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
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    info: (
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  }[type];

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-soft-appear">
      <div
        className={`relative flex items-center ${styleConfig.bg} text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm max-w-sm border ${styleConfig.border}/30 overflow-hidden`}
        style={{ 
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
        }}
      >
        {/* アクセントライン */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${styleConfig.accent}`}></div>
        
        {/* アイコンエリア */}
        <div className="flex-shrink-0 mr-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {icon}
          </div>
        </div>
        
        {/* メッセージエリア */}
        <div className="flex-grow">
          <p className="text-white font-semibold text-sm leading-relaxed">{message}</p>
        </div>
        
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        {/* 背景エフェクト */}
        <div className="absolute inset-0 bg-white/5 rounded-2xl"></div>
      </div>
    </div>
  );
};

export default Toast;
