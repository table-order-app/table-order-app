import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  colorScheme?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900'
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  }

  return (
    <div className={`bg-white rounded-xl border-2 ${colorClasses[colorScheme]} p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                trend.isPositive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex-shrink-0 ${iconColorClasses[colorScheme]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard