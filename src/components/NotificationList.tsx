import React, { useEffect, useState } from 'react'
import { Bell, Check, Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { supabase, Notification } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function NotificationList() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  useEffect(() => {
    let filtered = notifications

    if (filter === 'unread') {
      filtered = notifications.filter(n => !n.is_read)
    } else if (filter === 'read') {
      filtered = notifications.filter(n => n.is_read)
    }

    setFilteredNotifications(filtered)
  }, [notifications, filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          policy:policies(
            policy_number,
            policy_type,
            insurance_company,
            policyholder:policyholders(first_name, last_name)
          )
        `)
        .eq('agent_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('agent_id', user!.id)
        .eq('is_read', false)

      if (error) throw error
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'vencimiento':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'renovacion':
        return <TrendingUp className="w-5 h-5 text-blue-500" />
      case 'pago_pendiente':
        return <DollarSign className="w-5 h-5 text-red-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'vencimiento':
        return 'Vencimiento'
      case 'renovacion':
        return 'Renovación'
      case 'pago_pendiente':
        return 'Pago Pendiente'
      default:
        return 'Notificación'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} nuevas
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Alertas y recordatorios sobre tus pólizas
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            <Check className="w-4 h-4 mr-2" />
            Marcar Todas como Leídas
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            filter === 'unread'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          No Leídas ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            filter === 'read'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Leídas ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${
                notification.is_read 
                  ? 'border-gray-200 hover:shadow-md' 
                  : 'border-blue-200 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getNotificationTypeLabel(notification.notification_type)}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className={`text-sm mb-2 ${
                        notification.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {notification.policy && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Póliza:</span> {notification.policy.policy_number}
                          </p>
                          <p>
                            <span className="font-medium">Cliente:</span>{' '}
                            {notification.policy.policyholder?.first_name} {notification.policy.policyholder?.last_name}
                          </p>
                          <p>
                            <span className="font-medium">Tipo:</span>{' '}
                            <span className="capitalize">{notification.policy.policy_type}</span>
                          </p>
                          <p>
                            <span className="font-medium">Compañía:</span> {notification.policy.insurance_company}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-3 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Marcar como leída"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'unread' 
              ? 'No hay notificaciones sin leer' 
              : filter === 'read' 
              ? 'No hay notificaciones leídas'
              : 'No hay notificaciones'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Las notificaciones aparecerán aquí cuando tengas alertas sobre pólizas'
              : ''
            }
          </p>
        </div>
      )}
    </div>
  )
}
