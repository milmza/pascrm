import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Password reset functions
export const createPasswordResetCode = async (email: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('create_password_reset_code', {
      user_email: email
    })
    
    if (error) {
      console.error('Error creating reset code:', error)
      throw new Error(`Error al generar código: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No se pudo generar el código de recuperación')
    }
    
    return data
  } catch (error: any) {
    console.error('Error in createPasswordResetCode:', error)
    throw new Error(error.message || 'Error al generar código de recuperación')
  }
}

export const verifyResetCode = async (email: string, code: string): Promise<boolean> => {
  try {
    if (!email || !code) {
      return false
    }
    
    const { data, error } = await supabase.rpc('verify_reset_code', {
      user_email: email,
      verification_code: code
    })
    
    if (error) {
      console.error('Error verifying reset code:', error)
      return false
    }
    
    return data === true
  } catch (error: any) {
    console.error('Error in verifyResetCode:', error)
    return false
  }
}

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

export interface InsuranceCompany {
  id: string
  name: string
  description?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  is_active: boolean
  created_at: string
  updated_at: string
  agent_id: string
}

export interface PolicyType {
  id: string
  name: string
  description?: string
  icon: string
  is_active: boolean
  sort_order: number
  custom_fields: CustomField[]
  created_at: string
  updated_at: string
  agent_id: string
}

export interface CustomField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'tel'
  required: boolean
  options?: string[] // Para campos tipo select
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  is_active: boolean
  created_at: string
  agent_id: string
}

export interface CoverageType {
  id: string
  company_id: string
  name: string
  description?: string
  policy_type: string
  base_premium: number
  currency_code: string
  is_active: boolean
  created_at: string
  updated_at: string
  agent_id: string
  company?: InsuranceCompany
}

export interface Policy {
  id: string
  policy_number: string
  policyholder_id: string
  policy_type: string
  policy_type_id?: string
  insurance_company: string
  company_id?: string
  coverage_type_id?: string
  start_date: string
  end_date: string
  premium_amount: number
  currency_code: string
  payment_frequency: 'mensual' | 'trimestral' | 'semestral' | 'anual'
  coverage_details: Record<string, any>
  custom_data: Record<string, any> // Datos de campos personalizados
  status: 'activa' | 'vencida' | 'cancelada' | 'pendiente'
  created_at: string
  updated_at: string
  agent_id: string
  policyholder?: Policyholder
  company?: InsuranceCompany
  coverage_type?: CoverageType
  policy_type_obj?: PolicyType
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

export interface PasswordResetCode {
  id: string
  email: string
  code: string
  expires_at: string
  used: boolean
  created_at: string
}

// Campos personalizados predefinidos por tipo de póliza
export const getDefaultCustomFields = (policyTypeName: string): CustomField[] => {
  const baseId = Date.now()
  
  switch (policyTypeName.toLowerCase()) {
    case 'auto':
      return [
        {
          id: `${baseId}_1`,
          name: 'marca',
          label: 'Marca del Vehículo',
          type: 'text',
          required: true,
          placeholder: 'Ej: Toyota, Ford, Chevrolet'
        },
        {
          id: `${baseId}_2`,
          name: 'modelo',
          label: 'Modelo',
          type: 'text',
          required: true,
          placeholder: 'Ej: Corolla, Focus, Cruze'
        },
        {
          id: `${baseId}_3`,
          name: 'año',
          label: 'Año de Fabricación',
          type: 'number',
          required: true,
          validation: { min: 1900, max: new Date().getFullYear() + 1 }
        },
        {
          id: `${baseId}_4`,
          name: 'patente',
          label: 'Patente/Placa',
          type: 'text',
          required: true,
          placeholder: 'Ej: ABC123'
        },
        {
          id: `${baseId}_5`,
          name: 'numero_chasis',
          label: 'Número de Chasis',
          type: 'text',
          required: true,
          placeholder: 'Número de identificación del vehículo'
        },
        {
          id: `${baseId}_6`,
          name: 'numero_motor',
          label: 'Número de Motor',
          type: 'text',
          required: false,
          placeholder: 'Número de serie del motor'
        },
        {
          id: `${baseId}_7`,
          name: 'color',
          label: 'Color',
          type: 'text',
          required: false,
          placeholder: 'Color del vehículo'
        },
        {
          id: `${baseId}_8`,
          name: 'combustible',
          label: 'Tipo de Combustible',
          type: 'select',
          required: false,
          options: ['Gasolina', 'Diésel', 'GNC', 'Eléctrico', 'Híbrido']
        }
      ]

    case 'moto':
      return [
        {
          id: `${baseId}_1`,
          name: 'marca',
          label: 'Marca de la Motocicleta',
          type: 'text',
          required: true,
          placeholder: 'Ej: Honda, Yamaha, Kawasaki'
        },
        {
          id: `${baseId}_2`,
          name: 'modelo',
          label: 'Modelo',
          type: 'text',
          required: true,
          placeholder: 'Ej: CBR600, YZF-R1'
        },
        {
          id: `${baseId}_3`,
          name: 'año',
          label: 'Año de Fabricación',
          type: 'number',
          required: true,
          validation: { min: 1900, max: new Date().getFullYear() + 1 }
        },
        {
          id: `${baseId}_4`,
          name: 'patente',
          label: 'Patente/Placa',
          type: 'text',
          required: true,
          placeholder: 'Ej: ABC123'
        },
        {
          id: `${baseId}_5`,
          name: 'numero_chasis',
          label: 'Número de Chasis',
          type: 'text',
          required: true,
          placeholder: 'Número de identificación'
        },
        {
          id: `${baseId}_6`,
          name: 'numero_motor',
          label: 'Número de Motor',
          type: 'text',
          required: false,
          placeholder: 'Número de serie del motor'
        },
        {
          id: `${baseId}_7`,
          name: 'cilindrada',
          label: 'Cilindrada (cc)',
          type: 'number',
          required: false,
          placeholder: 'Ej: 600, 1000'
        }
      ]

    case 'bicicleta':
      return [
        {
          id: `${baseId}_1`,
          name: 'marca',
          label: 'Marca de la Bicicleta',
          type: 'text',
          required: true,
          placeholder: 'Ej: Trek, Giant, Specialized'
        },
        {
          id: `${baseId}_2`,
          name: 'modelo',
          label: 'Modelo',
          type: 'text',
          required: true,
          placeholder: 'Modelo específico'
        },
        {
          id: `${baseId}_3`,
          name: 'tipo',
          label: 'Tipo de Bicicleta',
          type: 'select',
          required: true,
          options: ['Urbana', 'Montaña', 'Ruta', 'Eléctrica', 'BMX', 'Híbrida']
        },
        {
          id: `${baseId}_4`,
          name: 'numero_serie',
          label: 'Número de Serie',
          type: 'text',
          required: true,
          placeholder: 'Número de identificación'
        },
        {
          id: `${baseId}_5`,
          name: 'color',
          label: 'Color',
          type: 'text',
          required: false,
          placeholder: 'Color principal'
        },
        {
          id: `${baseId}_6`,
          name: 'valor_compra',
          label: 'Valor de Compra',
          type: 'number',
          required: false,
          placeholder: 'Precio pagado por la bicicleta'
        }
      ]

    case 'hogar':
      return [
        {
          id: `${baseId}_1`,
          name: 'direccion_completa',
          label: 'Dirección Completa',
          type: 'textarea',
          required: true,
          placeholder: 'Dirección completa del inmueble'
        },
        {
          id: `${baseId}_2`,
          name: 'tipo_vivienda',
          label: 'Tipo de Vivienda',
          type: 'select',
          required: true,
          options: ['Casa', 'Apartamento', 'Duplex', 'Townhouse', 'Quinta', 'Local Comercial']
        },
        {
          id: `${baseId}_3`,
          name: 'metros_cuadrados',
          label: 'Metros Cuadrados',
          type: 'number',
          required: false,
          placeholder: 'Superficie en m²'
        },
        {
          id: `${baseId}_4`,
          name: 'año_construccion',
          label: 'Año de Construcción',
          type: 'number',
          required: false,
          validation: { min: 1800, max: new Date().getFullYear() }
        },
        {
          id: `${baseId}_5`,
          name: 'valor_inmueble',
          label: 'Valor del Inmueble',
          type: 'number',
          required: false,
          placeholder: 'Valor estimado del inmueble'
        },
        {
          id: `${baseId}_6`,
          name: 'valor_contenido',
          label: 'Valor del Contenido',
          type: 'number',
          required: false,
          placeholder: 'Valor de los bienes muebles'
        }
      ]

    case 'vida':
      return [
        {
          id: `${baseId}_1`,
          name: 'suma_asegurada',
          label: 'Suma Asegurada',
          type: 'number',
          required: true,
          placeholder: 'Monto de cobertura'
        },
        {
          id: `${baseId}_2`,
          name: 'beneficiarios',
          label: 'Beneficiarios',
          type: 'textarea',
          required: true,
          placeholder: 'Nombres y porcentajes de beneficiarios'
        },
        {
          id: `${baseId}_3`,
          name: 'ocupacion',
          label: 'Ocupación del Asegurado',
          type: 'text',
          required: true,
          placeholder: 'Profesión u ocupación'
        },
        {
          id: `${baseId}_4`,
          name: 'fumador',
          label: '¿Es fumador?',
          type: 'select',
          required: true,
          options: ['Sí', 'No', 'Ex-fumador']
        },
        {
          id: `${baseId}_5`,
          name: 'actividades_riesgo',
          label: 'Actividades de Riesgo',
          type: 'textarea',
          required: false,
          placeholder: 'Deportes extremos, actividades peligrosas, etc.'
        }
      ]

    case 'salud':
      return [
        {
          id: `${baseId}_1`,
          name: 'plan_cobertura',
          label: 'Plan de Cobertura',
          type: 'text',
          required: true,
          placeholder: 'Nombre del plan médico'
        },
        {
          id: `${baseId}_2`,
          name: 'medico_cabecera',
          label: 'Médico de Cabecera',
          type: 'text',
          required: false,
          placeholder: 'Nombre del médico asignado'
        },
        {
          id: `${baseId}_3`,
          name: 'preexistencias',
          label: 'Condiciones Preexistentes',
          type: 'textarea',
          required: false,
          placeholder: 'Enfermedades o condiciones médicas previas'
        },
        {
          id: `${baseId}_4`,
          name: 'grupo_familiar',
          label: 'Grupo Familiar',
          type: 'number',
          required: false,
          placeholder: 'Número de personas cubiertas'
        }
      ]

    case 'viaje':
      return [
        {
          id: `${baseId}_1`,
          name: 'destinos',
          label: 'Destinos de Viaje',
          type: 'textarea',
          required: true,
          placeholder: 'Países o regiones a visitar'
        },
        {
          id: `${baseId}_2`,
          name: 'fecha_salida',
          label: 'Fecha de Salida',
          type: 'date',
          required: true
        },
        {
          id: `${baseId}_3`,
          name: 'fecha_regreso',
          label: 'Fecha de Regreso',
          type: 'date',
          required: true
        },
        {
          id: `${baseId}_4`,
          name: 'motivo_viaje',
          label: 'Motivo del Viaje',
          type: 'select',
          required: true,
          options: ['Turismo', 'Negocios', 'Estudios', 'Trabajo', 'Familiar', 'Médico']
        },
        {
          id: `${baseId}_5`,
          name: 'actividades_deportivas',
          label: 'Actividades Deportivas',
          type: 'textarea',
          required: false,
          placeholder: 'Deportes o actividades a realizar'
        }
      ]

    case 'mascotas':
      return [
        {
          id: `${baseId}_1`,
          name: 'nombre_mascota',
          label: 'Nombre de la Mascota',
          type: 'text',
          required: true,
          placeholder: 'Nombre del animal'
        },
        {
          id: `${baseId}_2`,
          name: 'especie',
          label: 'Especie',
          type: 'select',
          required: true,
          options: ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro']
        },
        {
          id: `${baseId}_3`,
          name: 'raza',
          label: 'Raza',
          type: 'text',
          required: false,
          placeholder: 'Raza del animal'
        },
        {
          id: `${baseId}_4`,
          name: 'edad',
          label: 'Edad (años)',
          type: 'number',
          required: true,
          validation: { min: 0, max: 30 }
        },
        {
          id: `${baseId}_5`,
          name: 'peso',
          label: 'Peso (kg)',
          type: 'number',
          required: false,
          placeholder: 'Peso del animal'
        },
        {
          id: `${baseId}_6`,
          name: 'microchip',
          label: 'Número de Microchip',
          type: 'text',
          required: false,
          placeholder: 'Número de identificación'
        },
        {
          id: `${baseId}_7`,
          name: 'vacunas',
          label: 'Estado de Vacunación',
          type: 'select',
          required: true,
          options: ['Al día', 'Parcial', 'Sin vacunar']
        }
      ]

    default:
      return [
        {
          id: `${baseId}_1`,
          name: 'descripcion_bien',
          label: 'Descripción del Bien Asegurado',
          type: 'textarea',
          required: true,
          placeholder: 'Descripción detallada del bien o servicio asegurado'
        },
        {
          id: `${baseId}_2`,
          name: 'valor_asegurado',
          label: 'Valor Asegurado',
          type: 'number',
          required: false,
          placeholder: 'Valor del bien asegurado'
        }
      ]
  }
}