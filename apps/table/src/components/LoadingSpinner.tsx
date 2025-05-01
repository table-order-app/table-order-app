import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
  text?: string;
}

/**
 * ローディング状態を表すスピナーコンポーネント
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  fullScreen = false,
  text = "ローディング中...",
}) => {
  const spinnerSizes = {
    small: "w-5 h-5",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${spinnerSizes[size]} border-4 border-t-[#e0815e] border-gray-200 rounded-full animate-spin`}
      ></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
