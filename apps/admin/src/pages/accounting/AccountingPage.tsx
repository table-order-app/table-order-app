import React, { useState, useEffect } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { API_CONFIG } from '../../config'
import { useToast } from '../../components/ui/ToastContainer'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatCard from '../../components/ui/StatCard'

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
  // 検索用の日付範囲（初期表示は今日）
  const [displayStartDate, setDisplayStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [displayEndDate, setDisplayEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [dayClosingTime, setDayClosingTime] = useState('05:00')
  const [searchDate, setSearchDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeView, setActiveView] = useState<'daily' | 'settings'>('daily')
  
  const { addToast } = useToast()

  // 設定の取得
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('accorto_auth_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounting/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
        if (data.data?.dayClosingTime) {
          setDayClosingTime(data.data.dayClosingTime.slice(0, 5)) // HH:MM形式に変換
        }
      }
    } catch (error) {
      console.error('設定の取得に失敗しました:', error)
    }
  }

  // 日次売上の取得
  const fetchDailySales = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('accorto_auth_token')
      const params = new URLSearchParams({
        startDate: displayStartDate,
        endDate: displayEndDate
      })
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounting/daily-sales?${params}`, {
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
      const token = localStorage.getItem('accorto_auth_token')
      const params = new URLSearchParams({
        startDate: displayStartDate,
        endDate: displayEndDate,
        groupBy: 'day'
      })
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounting/sales-summary?${params}`, {
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
      const token = localStorage.getItem('accorto_auth_token')
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounting/daily-sales/calculate`, {
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

  // 指定日の売上を検索・集計
  const searchDailySales = async () => {
    if (isLoading || isCalculating) return;
    
    try {
      setIsCalculating(true)
      
      // 検索日付に絞って表示範囲を設定
      setDisplayStartDate(searchDate)
      setDisplayEndDate(searchDate)
      
      const token = localStorage.getItem('accorto_auth_token')
      
      // 指定日の集計を実行
      const calculateResponse = await fetch(`${API_CONFIG.BASE_URL}/accounting/daily-sales/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: searchDate })
      })
      
      if (calculateResponse.ok) {
        // 集計完了後、指定した日付範囲でデータを取得
        const params = new URLSearchParams({
          startDate: searchDate,
          endDate: searchDate
        })
        
        const salesResponse = await fetch(`${API_CONFIG.BASE_URL}/accounting/daily-sales?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (salesResponse.ok) {
          const data = await salesResponse.json()
          setDailySales(data.data)
          const dateStr = format(parseISO(searchDate), 'MM月dd日', { locale: ja })
          addToast({
            type: 'success',
            title: '集計完了',
            message: `${dateStr}の売上集計が完了しました`
          })
        }
      } else {
        const error = await calculateResponse.json()
        addToast({
          type: 'error',
          title: '集計エラー',
          message: error.error || '売上集計に失敗しました'
        })
      }
    } catch (error) {
      console.error('売上集計に失敗しました:', error)
      addToast({
        type: 'error',
        title: 'システムエラー',
        message: '売上集計中にエラーが発生しました'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // 過去30日間の表示に戻す
  const resetToDefault = () => {
    const start = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const end = format(new Date(), 'yyyy-MM-dd')
    setDisplayStartDate(start)
    setDisplayEndDate(end)
    fetchDailySales()
  }

  // 売上の確定
  const finalizeSales = async (date: string) => {
    const dateStr = format(parseISO(date), 'yyyy年MM月dd日', { locale: ja })
    if (!confirm(`${dateStr}の売上を確定しますか？\n\n確定後は変更できません。`)) {
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem('accorto_auth_token')
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounting/daily-sales/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date })
      })
      
      if (response.ok) {
        await fetchDailySales()
        addToast({
          type: 'success',
          title: '売上確定',
          message: `${dateStr}の売上が確定されました`
        })
      } else {
        const error = await response.json()
        addToast({
          type: 'error',
          title: '確定エラー',
          message: error.error || '売上確定に失敗しました'
        })
      }
    } catch (error) {
      console.error('売上確定に失敗しました:', error)
      addToast({
        type: 'error',
        title: 'システムエラー',
        message: '売上確定中にエラーが発生しました'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 日の切り替え時間の更新
  const updateDayClosingTime = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('accorto_auth_token')
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounting/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dayClosingTime: `${dayClosingTime}:00`
        })
      })
      
      if (response.ok) {
        await fetchSettings()
        addToast({
          type: 'success',
          title: '設定更新',
          message: '日の切り替え時間が更新されました'
        })
      } else {
        const error = await response.json()
        addToast({
          type: 'error',
          title: '設定エラー',
          message: error.error || '設定の更新に失敗しました'
        })
      }
    } catch (error) {
      console.error('設定の更新に失敗しました:', error)
      addToast({
        type: 'error',
        title: 'システムエラー',
        message: '設定更新中にエラーが発生しました'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      await fetchSettings()
      
      // 初期表示時は今日の日付で集計を実行
      const today = format(new Date(), 'yyyy-MM-dd')
      setDisplayStartDate(today)
      setDisplayEndDate(today)
      setSearchDate(today)
      
      // 今日の集計を実行
      await calculateDailySales(today)
    }
    
    initializeData()
  }, [])

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(num)
  }

  // 統計数値を計算
  const getStats = () => {
    if (dailySales.length === 0) return null
    
    const currentSales = dailySales[0]
    return {
      totalRevenue: currentSales.totalAmount,
      totalOrders: currentSales.totalOrders,
      totalItems: currentSales.totalItems,
      avgOrderValue: currentSales.totalOrders > 0 
        ? (parseFloat(currentSales.totalAmount) / currentSales.totalOrders).toFixed(0)
        : '0'
    }
  }

  const stats = getStats()


  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">会計管理</h1>
            <p className="mt-1 text-sm text-gray-500">日次売上の管理と集計を行います</p>
          </div>
          
          {/* タブナビゲーション */}
          <div className="mt-3 sm:mt-0">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveView('daily')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'daily'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                日次売上
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                設定
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

      {activeView === 'daily' && (
        <>
          {/* 統計カード */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="本日の売上"
                value={formatCurrency(stats.totalRevenue)}
                subtitle={format(parseISO(searchDate), 'yyyy年MM月dd日', { locale: ja })}
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
                colorScheme="green"
              />
              <StatCard
                title="注文数"
                value={`${stats.totalOrders}件`}
                subtitle="合計注文数"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                colorScheme="blue"
              />
              <StatCard
                title="商品数"
                value={`${stats.totalItems}点`}
                subtitle="合計商品点数"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
                colorScheme="yellow"
              />
              <StatCard
                title="平均単価"
                value={formatCurrency(stats.avgOrderValue)}
                subtitle="1注文あたり"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                colorScheme="gray"
              />
            </div>
          )}

          {/* クイック検索 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">日付別売上検索</h2>
              <p className="text-sm text-gray-500 mt-1">特定の日付の売上データを検索・集計します</p>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    検索日付
                  </label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <button
                    onClick={searchDailySales}
                    disabled={isCalculating}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                  >
                    {isCalculating ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        <span>集計中...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>検索・集計</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">会計設定</h2>
            <p className="text-sm text-gray-500 mt-1">日次集計の基本設定を管理します</p>
          </div>
          
          <div className="px-6 py-6">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日の切り替え時間
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="time"
                  value={dayClosingTime}
                  onChange={(e) => setDayClosingTime(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={updateDayClosingTime}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>保存</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                この時間までの注文は前日扱いになります。例：05:00なら朝5時までの注文は前日の売上として集計されます。
              </p>
            </div>
          </div>
        </div>
      )}

      {activeView === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">売上データ</h2>
            <p className="text-sm text-gray-500 mt-1">選択した日付の詳細な売上情報</p>
          </div>
          
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingSpinner size="lg" text="データを読み込んでいます..." />
            </div>
          ) : dailySales.length === 0 || (dailySales.length === 1 && dailySales[0].totalOrders === 0) ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">売上データがありません</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                {format(parseISO(searchDate), 'yyyy年MM月dd日', { locale: ja })}の売上データが見つかりません。別の日付を選択するか、集計を実行してください。
              </p>
              <button
                onClick={searchDailySales}
                disabled={isCalculating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {isCalculating ? '集計中...' : '現在の日付で集計する'}
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        会計日
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        注文数
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        商品数
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        売上金額
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状態
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dailySales.map((sales) => (
                      <tr key={sales.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {format(parseISO(sales.accountingDate), 'yyyy年MM月dd日', { locale: ja })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(parseISO(sales.periodStart), 'HH:mm', { locale: ja })} - {format(parseISO(sales.periodEnd), 'HH:mm', { locale: ja })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{sales.totalOrders}</div>
                          <div className="text-xs text-gray-500">件</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{sales.totalItems}</div>
                          <div className="text-xs text-gray-500">点</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{formatCurrency(sales.totalAmount)}</div>
                          <div className="text-xs text-gray-500">税込</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sales.isFinalized
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                              sales.isFinalized ? 'bg-green-400' : 'bg-yellow-400'
                            }`}></span>
                            {sales.isFinalized ? '確定済み' : '未確定'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => calculateDailySales(sales.accountingDate)}
                            disabled={isLoading || isCalculating}
                            className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                          >
                            再集計
                          </button>
                          {!sales.isFinalized && (
                            <button
                              onClick={() => finalizeSales(sales.accountingDate)}
                              disabled={isLoading || isCalculating}
                              className="text-green-600 hover:text-green-800 disabled:text-gray-400 transition-colors"
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
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  )
}

export default AccountingPage