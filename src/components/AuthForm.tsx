import React, { useState } from 'react'
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [isVerifyCode, setIsVerifyCode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signIn, signUp, requestPasswordReset, verifyPasswordResetCode, resetPasswordWithCode } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isVerifyCode) {
        // Verificar código y cambiar contraseña
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden')
          return
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          return
        }
        
        await resetPasswordWithCode(email, resetCode, password)
        setMessage('Contraseña actualizada exitosamente. Puedes iniciar sesión ahora.')
        
        // Resetear formulario y volver al login
        setTimeout(() => {
          resetForm()
          setIsResetPassword(false)
          setIsVerifyCode(false)
        }, 2000)
        
      } else if (isResetPassword) {
        // Solicitar código de recuperación
        await requestPasswordReset(email)
        setMessage('Se ha enviado un código de 6 dígitos a tu correo electrónico')
        setIsVerifyCode(true)
        
      } else if (isSignUp) {
        await signUp(email, password)
        setMessage('Cuenta creada exitosamente. Puedes iniciar sesión ahora.')
        setIsSignUp(false)
      } else {
        await signIn(email, password)
      }
    } catch (error: any) {
      setError(error.message || 'Ha ocurrido un error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setResetCode('')
    setError('')
    setMessage('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleModeChange = (mode: 'signin' | 'signup' | 'reset') => {
    resetForm()
    setIsSignUp(mode === 'signup')
    setIsResetPassword(mode === 'reset')
    setIsVerifyCode(false)
  }

  const handleBackToReset = () => {
    setIsVerifyCode(false)
    setResetCode('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-600 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            CRM Seguros
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isVerifyCode 
              ? 'Ingresa el código y tu nueva contraseña'
              : isResetPassword 
              ? 'Recupera tu contraseña' 
              : isSignUp 
              ? 'Crea tu cuenta de agente' 
              : 'Inicia sesión en tu cuenta'
            }
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Email field - always shown except in verify code step */}
            {!isVerifyCode && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="agente@seguros.com"
                  />
                </div>
              </div>
            )}

            {/* Verification code field */}
            {isVerifyCode && (
              <div>
                <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificación
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="resetCode"
                    name="resetCode"
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Ingresa el código de 6 dígitos enviado a {email}
                </p>
              </div>
            )}

            {/* Password field - shown for signup, signin, and verify code */}
            {(!isResetPassword || isVerifyCode) && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {isVerifyCode ? 'Nueva Contraseña' : 'Contraseña'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp || isVerifyCode ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm password field - only for verify code step */}
            {isVerifyCode && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  'Procesando...'
                ) : isVerifyCode ? (
                  'Cambiar Contraseña'
                ) : isResetPassword ? (
                  'Enviar Código'
                ) : isSignUp ? (
                  'Registrarse'
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>

            <div className="space-y-3">
              {isVerifyCode ? (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBackToReset}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver a solicitar código
                  </button>
                </div>
              ) : isResetPassword ? (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver al inicio de sesión
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => handleModeChange('reset')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => handleModeChange(isSignUp ? 'signin' : 'signup')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                    >
                      {isSignUp 
                        ? '¿Ya tienes cuenta? Inicia sesión' 
                        : '¿No tienes cuenta? Regístrate'
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}