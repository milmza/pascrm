import React, { useEffect, useState } from 'react'
import { 
  Users, 
  FileText, 
  Bell, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react'
import { supabase, Policy, Notification, Policyholder, Currency } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface DashboardStats {
  totalPolicyholders: number
  totalPolicies: number
  activePolicies: number
  expiringPolicies: number
  unreadNotifications: number
  monthlyPremiums: { [currency: string]: number }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalPolicyholders: 0,
    totalPolicies: 0,
    activePolicies: 0,
    expiringPolicies: 0,
    unreadNotifications: 0,
    monthlyPremiums: {}
  })
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const [expiringPolicies, setExpiringPolicies] = useState<Policy[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load currencies first
      const { data: currenciesData } = await supabase
        .from('currencies')
        .select('*')
        .eq('agent_id', user!.id)
        .eq('is_active', true)

      setCurrencies(currenciesData || [])

      // Get total policyholders
      const { count: policyholdersCount } = await supabase
        .from('policyholders')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user!.id)

      // Get total policies
      const { count: policiesCount } = await supabase
        .from('policies')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user!.id)

      // Get active policies
      const { count: activePoliciesCount } = await supabase
        .from('policies')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user!.id)
        .eq('status', 'activa')

      // Get expiring policies (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const { data: expiringPoliciesData, count: expiringCount } = await supabase
        .from('policies')
        .select(`
          *,
          policyholder:policyholders(first_name, last_name)
        `)
        .eq('agent_id', user!.id)
        .eq('status', 'activa')
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('end_date', { ascending: true })
        .limit(5)

      // Get unread notifications
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user!.id)
        .eq('is_read', false)

      // Get recent notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select(`
          *,
          policy:policies(policy_number, policy_type)
        `)
        .eq('agent_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Calculate monthly premiums by currency
      const { data: monthlyPolicies } = await supabase
        .from('policies')
        .select('premium_amount, payment_frequency, currency_code')
        .eq('agent_id', user!.id)
        .eq('status', 'activa')

      const monthlyPremiums: { [currency: string]: number } = {}
      monthlyPolicies?.forEach(policy => {
        const amount = policy.premium_amount
        const currency = policy.currency_code || 'EUR'
        
        if (!monthlyPremiums[currency]) {
          monthlyPremiums[currency] = 0
        }
        
        switch (policy.payment_frequency) {
          case 'mensual':
            monthlyPremiums[currency] += amount
            break
          case 'trimestral':
            monthlyPremiums[currency] += amount / 3
            break
          case 'semestral':
            monthlyPremiums[currency] += amount / 6
            break
          case 'anual':
            monthlyPremiums[currency] += amount / 12
            break
        }
      })

      // Round all amounts
      Object.keys(monthlyPremiums).forEach(currency => {
        monthlyPremiums[currency] = Math.round(monthlyPremiums[currency] * 100) / 100
      })

      setStats({
        totalPolicyholders: policyholdersCount || 0,
        totalPolicies: policiesCount || 0,
        activePolicies: activePoliciesCount || 0,
        expiringPolicies: expiringCount || 0,
        unreadNotifications: unreadCount || 0,
        monthlyPremiums
      })

      setRecentNotifications(notificationsData || [])
      setExpiringPolicies(expiringPoliciesData || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode)
    const symbol = currency?.symbol || currencyCode
    
    return new Intl.NumberFormat('es-ES', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + symbol
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date()
    const expiry = new Date(endDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'vencimiento':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'renovacion':
        return <TrendingUp className="w-4 h-4 text-blue-500" />
      case 'pago_pendiente':
        return <DollarSign className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Resumen de tu actividad como agente de seguros
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Asegurados
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.totalPolicyholders}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pólizas Activas
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.activePolicies}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Por Vencer (30 días)
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.expiringPolicies}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Primas Mensuales
                  </dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {Object.keys(stats.monthlyPremiums).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(stats.monthlyPremiums).map(([currency, amount]) => (
                          <div key={currency} className="text-sm">
                            {formatCurrency(amount, currency)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-2xl">0</span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Policies */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-600" />
              Pólizas por Vencer
            </h3>
          </div>
          <div className="px-6 py-4">
            {expiringPolicies.length > 0 ? (
              <div className="space-y-4">
                {expiringPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {policy.policyholder?.first_name} {policy.policyholder?.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {policy.policy_type.charAt(0).toUpperCase() + policy.policy_type.slice(1)} - {policy.policy_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-700">
                        {getDaysUntilExpiry(policy.end_date)} días
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(policy.end_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay pólizas próximas a vencer
              </p>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-600" />
              Notificaciones Recientes
              {stats.unreadNotifications > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {stats.unreadNotifications}
                </span>
              )}
            </h3>
          </div>
          <div className="px-6 py-4">
            {recentNotifications.length > 0 ? (
              <div className="space-y-4">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                    notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                  }`}>
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay notificaciones recientes
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}