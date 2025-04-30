import React from "react";

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`order-system-logo ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="#ffffff"
          stroke="#e0815e"
          strokeWidth="6"
        />
        <rect x="60" y="70" width="80" height="60" rx="5" fill="#e0815e" />
        <rect x="70" y="85" width="60" height="30" rx="2" fill="#ffffff" />
        <path
          d="M60 150 H140"
          stroke="#e0815e"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M80 50 L80 70"
          stroke="#e0815e"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M120 50 L120 70"
          stroke="#e0815e"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
