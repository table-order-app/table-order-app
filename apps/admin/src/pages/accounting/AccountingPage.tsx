import React, { useState, useEffect } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'

// 型定義
interface AccountingSettings {
  id: number
  storeId: number
  dayClosingTime: string
  taxRate: number
  autoCloseEnabled: boolean
  autoCloseTime: string
  displayCurrency: string
}

interface DailySales {
  id: number
  storeId: number
  accountingDate: string
  totalOrders: number
  totalItems: number
  totalAmount: string
  taxAmount: string
  periodStart: string
  periodEnd: string
  isFinalized: boolean
  createdAt: string
  updatedAt: string
}

interface SalesSummary {
  period: string
  totalOrders: number
  totalItems: number
  totalAmount: string
  taxAmount: string
  avgOrderAmount: string
}

const AccountingPage = () => {
  const [settings, setSettings] = useState<AccountingSettings | null>(null)
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [summary, setSummary] = useState<SalesSummary[]>([])
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 7), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // 設定の取得
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('storeToken')
      const response = await fetch('/api/accounting/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
      }
    } catch (error) {
      console.error('設定の取得に失敗しました:', error)
    }
  }

  // 日次売上の取得
  const fetchDailySales = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('storeToken')
      const params = new URLSearchParams({
        startDate,
        endDate
      })
      
      const response = await fetch(`/api/accounting/daily-sales?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDailySales(data.data)
      }
    } catch (error) {
      console.error('日次売上の取得に失敗しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 売上サマリーの取得
  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('storeToken')
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy: 'day'
      })
      
      const response = await fetch(`/api/accounting/sales-summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSummary(data.data)
      }
    } catch (error) {
      console.error('売上サマリーの取得に失敗しました:', error)
    }
  }

  // 日次売上の集計実行
  const calculateDailySales = async (date: string) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('storeToken')
      
      const response = await fetch('/api/accounting/daily-sales/calculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date })
      })
      
      if (response.ok) {
        await fetchDailySales()
        alert('売上集計が完了しました')
      } else {
        const error = await response.json()
        alert(`集計に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('売上集計に失敗しました:', error)
      alert('売上集計に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 売上の確定
  const finalizeSales = async (date: string) => {
    if (!confirm(`${date} の売上を確定しますか？確定後は変更できません。`)) {
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem('storeToken')
      
      const response = await fetch('/api/accounting/daily-sales/finalize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date })
      })
      
      if (response.ok) {
        await fetchDailySales()
        alert('売上が確定されました')
      } else {
        const error = await response.json()
        alert(`確定に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('売上確定に失敗しました:', error)
      alert('売上確定に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 設定の更新
  const updateSettings = async (newSettings: Partial<AccountingSettings>) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('storeToken')
      
      const response = await fetch('/api/accounting/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      })
      
      if (response.ok) {
        await fetchSettings()
        setIsSettingsOpen(false)
        alert('設定が更新されました')
      } else {
        const error = await response.json()
        alert(`設定の更新に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('設定の更新に失敗しました:', error)
      alert('設定の更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchDailySales()
    fetchSummary()
  }, [startDate, endDate])

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(num)
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM形式
  }

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">会計管理</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          設定
        </button>
      </div>

      {/* 期間選択 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">期間選択</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開始日
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              終了日
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                fetchDailySales()
                fetchSummary()
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              更新
            </button>
          </div>
        </div>
      </div>

      {/* 日次売上一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">日次売上</h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会計日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注文数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    売上金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailySales.map((sales) => (
                  <tr key={sales.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(parseISO(sales.accountingDate), 'yyyy年MM月dd日', { locale: ja })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sales.totalOrders}件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sales.totalItems}点
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sales.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sales.isFinalized
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sales.isFinalized ? '確定済み' : '未確定'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      <button
                        onClick={() => calculateDailySales(sales.accountingDate)}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        再集計
                      </button>
                      {!sales.isFinalized && (
                        <button
                          onClick={() => finalizeSales(sales.accountingDate)}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-800 disabled:text-gray-400"
                        >
                          確定
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 今日の売上集計ボタン */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">今日の売上集計</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => calculateDailySales(format(new Date(), 'yyyy-MM-dd'))}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            今日の売上を集計
          </button>
          <button
            onClick={() => calculateDailySales(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
            disabled={isLoading}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            昨日の売上を集計
          </button>
        </div>
      </div>

      {/* 設定モーダル */}
      {isSettingsOpen && settings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">会計設定</h2>
            
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                updateSettings({
                  dayClosingTime: formData.get('dayClosingTime') as string,
                  taxRate: parseFloat(formData.get('taxRate') as string) / 100,
                  autoCloseEnabled: formData.get('autoCloseEnabled') === 'on',
                  autoCloseTime: formData.get('autoCloseTime') as string,
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日の切り替え時間
                </label>
                <input
                  type="time"
                  name="dayClosingTime"
                  defaultValue={formatTime(settings.dayClosingTime)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  この時間まで前日扱いになります
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  税率 (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={(settings.taxRate * 100).toFixed(2)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="autoCloseEnabled"
                    defaultChecked={settings.autoCloseEnabled}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    自動締め処理を有効にする
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自動締め時間
                </label>
                <input
                  type="time"
                  name="autoCloseTime"
                  defaultValue={formatTime(settings.autoCloseTime)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountingPage