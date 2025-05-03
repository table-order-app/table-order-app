import React, { ReactNode } from "react";
import { Button } from "./Button";

type CardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  buttonVariant?: "primary" | "secondary";
  onClick?: (e?: React.MouseEvent) => void;
  icon?: ReactNode;
  isClickable?: boolean;
};

export const Card: React.FC<CardProps> = ({
  title,
  description,
  buttonLabel,
  buttonVariant = "primary",
  onClick,
  icon,
  isClickable = false,
}) => {
  const handleCardClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-md transition-all duration-200 
        ${isClickable ? "cursor-pointer hover:shadow-lg hover:translate-y-[-4px]" : "hover:shadow-md"}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start mb-3">
        {icon && <div className="mr-3 text-primary">{icon}</div>}
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <Button
        label={buttonLabel}
        variant={buttonVariant}
        onClick={(e) => {
          if (onClick) {
            // カード全体がクリック可能な場合はイベントの伝播を止める
            if (isClickable) {
              e.stopPropagation();
            }
            onClick(e);
          }
        }}
      />
    </div>
  );
};
