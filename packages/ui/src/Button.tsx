import React from "react";

type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
};

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = "primary",
}) => {
  const baseStyles = "px-4 py-2 rounded text-white";
  const variantStyles = variant === "primary" ? "bg-primary" : "bg-secondary";

  return <button className={`${baseStyles} ${variantStyles}`}>{label}</button>;
};
