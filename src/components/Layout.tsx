import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  FileText, 
  Bell, 
  LogOut, 
  Shield,
  Menu,
  X,
  Building2,
  Settings,
  DollarSign
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Asegurados', href: '/policyholders', icon: Users },
    { name: 'Pólizas', href: '/policies', icon: FileText },
    { name: 'Compañías', href: '/companies', icon: Building2 },
    { name: 'Notificaciones', href: '/notifications', icon: Bell },
  ]

  const settingsNavigation = [
    { name: 'Tipos de Pólizas', href: '/settings/policy-types', icon: Settings },
    { name: 'Monedas', href: '/settings/currencies', icon: DollarSign },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="main-layout">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''} lg:relative lg:transform-none bg-white shadow-lg flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CRM Seguros</span>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Flexible area */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <item.icon 
                    className={`
                      mr-3 h-5 w-5 transition-colors duration-200
                      ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                    `} 
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Settings Section */}
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Configuración
            </h3>
            <div className="mt-2 space-y-1">
              {settingsNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon 
                      className={`
                        mr-3 h-5 w-5 transition-colors duration-200
                        ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                      `} 
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* User info and sign out - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500">Agente de Seguros</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content desktop-content flex flex-col">
        {/* Top header for mobile */}
        <div className="mobile-header lg:hidden flex items-center justify-between h-16 px-4 bg-white shadow-sm border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">CRM Seguros</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
