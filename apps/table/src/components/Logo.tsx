import React from "react";

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="#fff7ed"
          stroke="#fb923c"
          strokeWidth="3"
        />
        
        {/* Main plate/dish */}
        <rect 
          x="60" 
          y="70" 
          width="80" 
          height="60" 
          rx="6" 
          fill="#f97316" 
        />
        
        {/* Inner dish detail */}
        <rect 
          x="70" 
          y="85" 
          width="60" 
          height="30" 
          rx="3" 
          fill="#ffffff" 
        />
        
        {/* Table surface line */}
        <path
          d="M60 150 H140"
          stroke="#f97316"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Table legs */}
        <path
          d="M80 50 L80 70"
          stroke="#f97316"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M120 50 L120 70"
          stroke="#f97316"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
