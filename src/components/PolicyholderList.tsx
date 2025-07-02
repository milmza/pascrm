
    import React, { useEffect, useState } from 'react'
    import { Plus, Search, Edit2, Trash2, User, Phone, Mail, Building2, Users } from 'lucide-react'
    import { supabase, Policyholder } from '../lib/supabase'
    import { useAuth } from '../contexts/AuthContext'

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
            const fullName = policyholder.entity_type === 'fisico'
              ? `${policyholder.first_name} ${policyholder.last_name}`
              : policyholder.business_name || ''

            return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              policyholder.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              policyholder.phone?.includes(searchTerm) ||
              policyholder.dni?.includes(searchTerm) ||
              policyholder.cuil_cuit?.includes(searchTerm)
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

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES')
      }

      const getDisplayName = (policyholder: Policyholder) => {
        if (policyholder.entity_type === 'fisico') {
          return `${policyholder.first_name} ${policyholder.last_name}`
        } else {
          return policyholder.business_name || 'Sin nombre'
        }
      }

      const getEntityTypeLabel = (type: string) => {
        return type === 'fisico' ? 'Persona Física' : 'Persona Jurídica'
      }

      const getEntityIcon = (type: string) => {
        return type === 'fisico' ? User : Building2
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
                Gestiona la información de tus clientes asegurados (personas físicas y jurídicas)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{policyholders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Personas Físicas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {policyholders.filter(p => p.entity_type === 'fisico').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Personas Jurídicas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {policyholders.filter(p => p.entity_type === 'juridico').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Policyholders Grid */}
          {filteredPolicyholders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolicyholders.map((policyholder) => {
                const EntityIcon = getEntityIcon(policyholder.entity_type)
                return (
                  <div key={policyholder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              policyholder.entity_type === 'fisico' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              <EntityIcon className={`w-5 h-5 ${
                                policyholder.entity_type === 'fisico' ? 'text-blue-600' : 'text-purple-600'
                              }`} />
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {getDisplayName(policyholder)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {getEntityTypeLabel(policyholder.entity_type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
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
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">DNI:</span> {policyholder.dni}
                          </div>
                        )}
                        {policyholder.cuil_cuit && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">
                              {policyholder.entity_type === 'fisico' ? 'CUIL:' : 'CUIT:'}
                            </span> {policyholder.cuil_cuit}
                          </div>
                        )}

                        {/* Business specific info */}
                        {policyholder.entity_type === 'juridico' && (
                          <>
                            {policyholder.business_type && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Tipo:</span> {policyholder.business_type}
                              </div>
                            )}
                            {policyholder.legal_representative && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Representante:</span> {policyholder.legal_representative}
                              </div>
                            )}
                          </>
                        )}

                        {/* Contact info */}
                        {policyholder.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {policyholder.email}
                          </div>
                        )}
                        {policyholder.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {policyholder.phone}
                          </div>
                        )}
                        {policyholder.city && (
                          <div className="text-sm text-gray-600">
                            📍 {policyholder.city}
                            {policyholder.state && `, ${policyholder.state}`}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Registrado: {formatDate(policyholder.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
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
        'Empresa Unipersonal',
        'Cooperativa',
        'Fundación',
        'Asociación Civil',
        'ONG',
        'Mutual',
        'Sindicato',
        'Otro'
      ]

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
          const dataToSave = {
            ...formData,
            agent_id: user!.id,
            // Clear fields that don't apply to the entity type
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

          if (policyholder) {
            // Update existing
            const { error } = await supabase
              .from('policyholders')
              .update(dataToSave)
              .eq('id', policyholder.id)

            if (error) {
              console.error('Error updating policyholder:', error)
              alert(`Error al guardar el asegurado: ${error.message}`)
              throw error
            }
          } else {
            // Create new
            const { error } = await supabase
              .from('policyholders')
              .insert([dataToSave])

            if (error) {
              console.error('Error inserting policyholder:', error)
              alert(`Error al guardar el asegurado: ${error.message}`)
              throw error
            }
          }

          onSave()
        } catch (error: any) {
          console.error('Error saving policyholder:', error)
          alert('Error al guardar el asegurado')
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
                <h4 className="text-md font-medium text-gray-900 mb-3">Tipo de Entidad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    formData.entity_type === 'fisico'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="entity_type"
                      value="fisico"
                      checked={formData.entity_type === 'fisico'}
                      onChange={(e) => setFormData({ ...formData, entity_type: e.target.value as 'fisico' | 'juridico' })}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <User className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Persona Física</div>
                        <div className="text-sm text-gray-500">Individuo particular</div>
                      </div>
                    </div>
                  </label>

                  <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    formData.entity_type === 'juridico'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="entity_type"
                      value="juridico"
                      checked={formData.entity_type === 'juridico'}
                      onChange={(e) => setFormData({ ...formData, entity_type: e.target.value as 'fisico' | 'juridico' })}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <Building2 className="w-6 h-6 text-purple-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Persona Jurídica</div>
                        <div className="text-sm text-gray-500">Empresa, ONG, etc.</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Fields Based on Entity Type */}
              {formData.entity_type === 'fisico' ? (
                // Physical Person Fields
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
                        value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12345678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CUIL
                      </label>
                      <input
                        type="text"
                        value={formData.cuil_cuit}
                        onChange={(e) => setFormData({ ...formData, cuil_cuit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="20-12345678-9"
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
              ) : (
                // Legal Entity Fields
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
                        placeholder="Nombre completo de la empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Empresa
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
                        value={formData.cuil_cuit}
                        onChange={(e) => setFormData({ ...formData, cuil_cuit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="30-12345678-9"
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
                      value={