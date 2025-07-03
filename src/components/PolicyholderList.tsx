import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Users, Building2, User, Phone, Mail, MapPin, Calendar, MessageCircle } from 'lucide-react'
import { supabase, Policyholder } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatPolicyholderName, openWhatsApp } from '../utils/formatUtils'

export default function PolicyholderList() {
  const { user } = useAuth()
  const [policyholders, setPolicyholders] = useState<Policyholder[]>([])
  const [filteredPolicyholders, setFilteredPolicyholders] = useState<Policyholder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // all, fisico, juridico
  const [showModal, setShowModal] = useState(false)
  const [editingPolicyholder, setEditingPolicyholder] = useState<Policyholder | null>(null)

  useEffect(() => {
    if (user) {
      loadPolicyholders()
    }
  }, [user])

  useEffect(() => {
    let filtered = policyholders

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(policyholder => {
        const searchLower = searchTerm.toLowerCase()
        const fullName = formatPolicyholderName(policyholder).toLowerCase()
        
        return fullName.includes(searchLower) ||
          (policyholder.email || '').toLowerCase().includes(searchLower) ||
          (policyholder.phone || '').includes(searchTerm) ||
          (policyholder.dni || '').includes(searchTerm) ||
          (policyholder.cuil_cuit || '').includes(searchTerm)
      })
    }

    // Filter by entity type
    if (filterType !== 'all') {
      filtered = filtered.filter(policyholder => policyholder.entity_type === filterType)
    }

    setFilteredPolicyholders(filtered)
  }, [policyholders, searchTerm, filterType])

  const loadPolicyholders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('policyholders')
        .select('*')
        .eq('agent_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPolicyholders(data || [])
    } catch (error) {
      console.error('Error loading policyholders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (policyholder: Policyholder) => {
    setEditingPolicyholder(policyholder)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este asegurado?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('policyholders')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadPolicyholders()
    } catch (error) {
      console.error('Error deleting policyholder:', error)
      alert('Error al eliminar el asegurado')
    }
  }

  const handleWhatsApp = (policyholder: Policyholder) => {
    if (!policyholder.phone) {
      alert('Este asegurado no tiene número de teléfono registrado')
      return
    }
    
    const name = formatPolicyholderName(policyholder)
    const message = `Hola ${name}, soy tu agente de seguros. ¿Cómo estás?`
    openWhatsApp(policyholder.phone, message)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const formatCuilCuit = (value: string) => {
    if (!value) return ''
    // Remove any non-numeric characters
    const numbers = value.replace(/\D/g, '')
    
    // Format as XX-XXXXXXXX-X for CUIL/CUIT
    if (numbers.length >= 11) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10, 11)}`
    } else if (numbers.length >= 3) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    } else if (numbers.length >= 1) {
      return numbers
    }
    return ''
  }

  const formatDni = (value: string) => {
    if (!value) return ''
    // Remove any non-numeric characters and format with dots
    const numbers = value.replace(/\D/g, '')
    
    // Format as XX.XXX.XXX for DNI
    if (numbers.length >= 8) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}`
    } else if (numbers.length >= 5) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    } else if (numbers.length >= 3) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    }
    return numbers
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asegurados</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona la información de tus clientes asegurados
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPolicyholder(null)
            setShowModal(true)
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Asegurado
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono, DNI o CUIL/CUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Todos los tipos</option>
          <option value="fisico">Personas Físicas</option>
          <option value="juridico">Personas Jurídicas</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {policyholders.length}
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
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Personas Físicas
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {policyholders.filter(p => p.entity_type === 'fisico').length}
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
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Personas Jurídicas
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {policyholders.filter(p => p.entity_type === 'juridico').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policyholders Grid */}
      {filteredPolicyholders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPolicyholders.map((policyholder) => (
            <div key={policyholder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        policyholder.entity_type === 'fisico' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {policyholder.entity_type === 'fisico' ? (
                          <User className={`w-5 h-5 ${policyholder.entity_type === 'fisico' ? 'text-green-600' : 'text-purple-600'}`} />
                        ) : (
                          <Building2 className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {formatPolicyholderName(policyholder)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {policyholder.entity_type === 'fisico' ? 'Persona Física' : 'Persona Jurídica'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {policyholder.phone && (
                      <button
                        onClick={() => handleWhatsApp(policyholder)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(policyholder)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(policyholder.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Identification */}
                  {policyholder.entity_type === 'fisico' && policyholder.dni && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium w-16">DNI:</span>
                      <span>{formatDni(policyholder.dni)}</span>
                    </div>
                  )}
                  
                  {policyholder.cuil_cuit && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium w-16">
                        {policyholder.entity_type === 'fisico' ? 'CUIL:' : 'CUIT:'}
                      </span>
                      <span>{formatCuilCuit(policyholder.cuil_cuit)}</span>
                    </div>
                  )}

                  {/* Business specific info */}
                  {policyholder.entity_type === 'juridico' && (
                    <>
                      {policyholder.business_type && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-16">Tipo:</span>
                          <span>{policyholder.business_type}</span>
                        </div>
                      )}
                      {policyholder.legal_representative && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-16">Rep.:</span>
                          <span>{policyholder.legal_representative}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Contact info */}
                  {policyholder.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate">{policyholder.email}</span>
                    </div>
                  )}
                  
                  {policyholder.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{policyholder.phone}</span>
                    </div>
                  )}
                  
                  {policyholder.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate">{policyholder.address}</span>
                    </div>
                  )}

                  {/* Birth date for physical persons */}
                  {policyholder.entity_type === 'fisico' && policyholder.date_of_birth && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Nacimiento: {formatDate(policyholder.date_of_birth)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay asegurados</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterType !== 'all' 
              ? 'No se encontraron resultados con los filtros actuales' 
              : 'Comienza agregando tu primer asegurado'
            }
          </p>
        </div>
      )}

      {/* Modal for Add/Edit Policyholder */}
      {showModal && (
        <PolicyholderModal
          policyholder={editingPolicyholder}
          onClose={() => setShowModal(false)}
          onSave={() => {
            loadPolicyholders()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

// Policyholder Modal Component
function PolicyholderModal({ 
  policyholder, 
  onClose, 
  onSave 
}: { 
  policyholder: Policyholder | null
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    entity_type: policyholder?.entity_type || 'fisico',
    first_name: policyholder?.first_name || '',
    last_name: policyholder?.last_name || '',
    business_name: policyholder?.business_name || '',
    business_type: policyholder?.business_type || '',
    legal_representative: policyholder?.legal_representative || '',
    dni: policyholder?.dni || '',
    cuil_cuit: policyholder?.cuil_cuit || '',
    email: policyholder?.email || '',
    phone: policyholder?.phone || '',
    address: policyholder?.address || '',
    city: policyholder?.city || '',
    state: policyholder?.state || '',
    postal_code: policyholder?.postal_code || '',
    date_of_birth: policyholder?.date_of_birth || '',
  })

  const businessTypes = [
    'Sociedad Anónima (S.A.)',
    'Sociedad de Responsabilidad Limitada (S.R.L.)',
    'Sociedad Colectiva',
    'Sociedad en Comandita Simple',
    'Sociedad en Comandita por Acciones',
    'Sociedad de Capital e Industria',
    'Cooperativa',
    'Mutual',
    'Fundación',
    'Asociación Civil',
    'ONG',
    'Empresa Unipersonal',
    'Monotributista',
    'Otro'
  ]

  const handleNumericInput = (value: string, field: 'dni' | 'cuil_cuit') => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/\D/g, '')
    
    // Limit length based on field type
    const maxLength = field === 'dni' ? 8 : 11
    const limitedValue = numericValue.slice(0, maxLength)
    
    setFormData({ ...formData, [field]: limitedValue })
  }

  const formatCuilCuit = (value: string) => {
    if (!value) return ''
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length >= 11) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10, 11)}`
    } else if (numbers.length >= 3) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    }
    return numbers
  }

  const formatDni = (value: string) => {
    if (!value) return ''
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length >= 8) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}`
    } else if (numbers.length >= 5) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    } else if (numbers.length >= 3) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    }
    return numbers
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        agent_id: user!.id,
        // Clear fields based on entity type
        ...(formData.entity_type === 'fisico' ? {
          business_name: null,
          business_type: null,
          legal_representative: null,
        } : {
          first_name: null,
          last_name: null,
          date_of_birth: null,
        })
      }

      // Clean empty strings to null for database consistency
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key as keyof typeof dataToSave] === '') {
          (dataToSave as any)[key] = null
        }
      })

      if (policyholder) {
        // Update existing
        const { error } = await supabase
          .from('policyholders')
          .update(dataToSave)
          .eq('id', policyholder.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('policyholders')
          .insert([dataToSave])

        if (error) throw error
      }

      onSave()
    } catch (error: any) {
      console.error('Error saving policyholder:', error)
      
      // Handle specific database errors
      if (error.code === '23505') {
        if (error.message.includes('dni')) {
          alert('Ya existe un asegurado con este DNI')
        } else if (error.message.includes('cuil_cuit')) {
          alert('Ya existe un asegurado con este CUIL/CUIT')
        } else {
          alert('Ya existe un asegurado con estos datos')
        }
      } else {
        alert('Error al guardar el asegurado: ' + (error.message || 'Error desconocido'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {policyholder ? 'Editar Asegurado' : 'Nuevo Asegurado'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entity Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Entidad *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="entity_type"
                  value="fisico"
                  checked={formData.entity_type === 'fisico'}
                  onChange={(e) => setFormData({ ...formData, entity_type: e.target.value as 'fisico' | 'juridico' })}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <User className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <div className="font-medium">Persona Física</div>
                    <div className="text-sm text-gray-500">Individuos particulares</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="entity_type"
                  value="juridico"
                  checked={formData.entity_type === 'juridico'}
                  onChange={(e) => setFormData({ ...formData, entity_type: e.target.value as 'fisico' | 'juridico' })}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 text-purple-600 mr-2" />
                  <div>
                    <div className="font-medium">Persona Jurídica</div>
                    <div className="text-sm text-gray-500">Empresas, ONGs, etc.</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Personal Information for Physical Persons */}
          {formData.entity_type === 'fisico' && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Información Personal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={formatDni(formData.dni)}
                    onChange={(e) => handleNumericInput(e.target.value, 'dni')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12.345.678"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CUIL
                  </label>
                  <input
                    type="text"
                    value={formatCuilCuit(formData.cuil_cuit)}
                    onChange={(e) => handleNumericInput(e.target.value, 'cuil_cuit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20-12345678-9"
                    maxLength={13}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Information for Legal Entities */}
          {formData.entity_type === 'juridico' && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Información de la Empresa</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Entidad
                  </label>
                  <select
                    value={formData.business_type}
                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar tipo</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CUIT *
                  </label>
                  <input
                    type="text"
                    required
                    value={formatCuilCuit(formData.cuil_cuit)}
                    onChange={(e) => handleNumericInput(e.target.value, 'cuil_cuit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30-12345678-9"
                    maxLength={13}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Representante Legal
                  </label>
                  <input
                    type="text"
                    value={formData.legal_representative}
                    onChange={(e) => setFormData({ ...formData, legal_representative: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del representante legal"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Información de Contacto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia/Estado
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}