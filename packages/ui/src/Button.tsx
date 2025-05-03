import React from "react";

type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = "primary",
  onClick,
}) => {
  const baseStyles = "px-4 py-2 rounded text-white";
  const variantStyles = variant === "primary" ? "bg-primary" : "bg-secondary";

  return (
    <button className={`${baseStyles} ${variantStyles}`} onClick={onClick}>
      {label}
    </button>
  );
};
