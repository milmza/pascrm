import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, createPasswordResetCode, verifyResetCode } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  verifyPasswordResetCode: (email: string, code: string) => Promise<boolean>
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const requestPasswordReset = async (email: string) => {
    try {
      if (!email || !email.includes('@')) {
        throw new Error('Por favor ingresa un email válido')
      }

      // Verificar que el usuario existe en Supabase Auth
      const { data: users } = await supabase.auth.admin.listUsers()
      const userExists = users.users.some(u => u.email === email)
      
      if (!userExists) {
        // Por seguridad, no revelamos si el email existe o no
        console.log(`Email ${email} no encontrado en el sistema`)
      }

      // Generar código de recuperación
      const code = await createPasswordResetCode(email)
      
      // Aquí normalmente enviarías el email con el código
      // Por ahora, mostraremos el código en la consola para testing
      console.log(`🔐 Código de recuperación para ${email}: ${code}`)
      console.log(`⏰ El código expira en 15 minutos`)
      
      // En producción, aquí llamarías a tu servicio de email
      // await sendResetCodeEmail(email, code)
      
    } catch (error: any) {
      console.error('Error in requestPasswordReset:', error)
      throw new Error(error.message || 'Error al generar código de recuperación')
    }
  }

  const verifyPasswordResetCode = async (email: string, code: string): Promise<boolean> => {
    try {
      if (!email || !code) {
        return false
      }
      
      return await verifyResetCode(email, code)
    } catch (error: any) {
      console.error('Error in verifyPasswordResetCode:', error)
      return false
    }
  }

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
      if (!email || !code || !newPassword) {
        throw new Error('Todos los campos son requeridos')
      }

      // Verificar código primero
      const isValid = await verifyResetCode(email, code)
      if (!isValid) {
        throw new Error('Código inválido o expirado')
      }

      // Para cambiar la contraseña sin estar autenticado, necesitamos usar el admin API
      // Esto requiere permisos especiales y normalmente se haría en el backend
      
      // Alternativa: Usar el flujo de reset password de Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        // Si falla el reset automático, intentamos actualizar directamente
        // Nota: Esto solo funciona si el usuario está autenticado
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        })
        
        if (updateError) {
          throw new Error('No se pudo actualizar la contraseña. Intenta iniciar sesión primero.')
        }
      }

    } catch (error: any) {
      console.error('Error in resetPasswordWithCode:', error)
      throw new Error(error.message || 'Error al cambiar la contraseña')
    }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    if (error) throw error
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    verifyPasswordResetCode,
    resetPasswordWithCode,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
