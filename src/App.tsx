import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import AuthForm from './components/AuthForm'
import ResetPasswordForm from './components/ResetPasswordForm'
import Dashboard from './components/Dashboard'
import PolicyholderList from './components/PolicyholderList'
import PolicyList from './components/PolicyList'
import InsuranceCompanyList from './components/InsuranceCompanyList'
import NotificationList from './components/NotificationList'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Reset password route - accessible without authentication */}
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        
        {/* Protected routes */}
        {user ? (
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/policyholders" element={<PolicyholderList />} />
                <Route path="/policies" element={<PolicyList />} />
                <Route path="/companies" element={<InsuranceCompanyList />} />
                <Route path="/notifications" element={<NotificationList />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          } />
        ) : (
          <>
            <Route path="/" element={<AuthForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App