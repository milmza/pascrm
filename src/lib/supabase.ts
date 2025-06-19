import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Policyholder {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  date_of_birth?: string
  created_at: string
  updated_at: string
  agent_id: string
}

export interface Policy {
  id: string
  policy_number: string
  policyholder_id: string
  policy_type: 'vida' | 'auto' | 'moto' | 'bicicleta' | 'hogar' | 'otro'
  insurance_company: string
  start_date: string
  end_date: string
  premium_amount: number
  payment_frequency: 'mensual' | 'trimestral' | 'semestral' | 'anual'
  coverage_details: Record<string, any>
  status: 'activa' | 'vencida' | 'cancelada' | 'pendiente'
  created_at: string
  updated_at: string
  agent_id: string
  policyholder?: Policyholder
}

export interface Notification {
  id: string
  policy_id: string
  notification_type: 'vencimiento' | 'pago_pendiente' | 'renovacion'
  notification_date: string
  message: string
  is_read: boolean
  created_at: string
  agent_id: string
  policy?: Policy
}