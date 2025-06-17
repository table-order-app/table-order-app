import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'gray' | 'white'
  text?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    gray: 'border-gray-600',
    white: 'border-white'
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <span className="text-sm text-gray-600 animate-pulse">{text}</span>
      )}
    </div>
  )
}

export default LoadingSpinner