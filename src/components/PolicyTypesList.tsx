import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, FileText, Eye, EyeOff, GripVertical, Settings } from 'lucide-react'
import { supabase, PolicyType, CustomField, getDefaultCustomFields } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function PolicyTypesList() {
  const { user } = useAuth()
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([])
  const [filteredPolicyTypes, setFilteredPolicyTypes] = useState<PolicyType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFieldsModal, setShowFieldsModal] = useState(false)
  const [editingPolicyType, setEditingPolicyType] = useState<PolicyType | null>(null)

  useEffect(() => {
    if (user) {
      loadPolicyTypes()
    }
  }, [user])

  useEffect(() => {
    const filtered = policyTypes.filter(policyType =>
      policyType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policyType.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPolicyTypes(filtered)
  }, [policyTypes, searchTerm])

  const loadPolicyTypes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('policy_types')
        .select('*')
        .eq('agent_id', user!.id)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setPolicyTypes(data || [])
    } catch (error) {
      console.error('Error loading policy types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (policyType: PolicyType) => {
    setEditingPolicyType(policyType)
    setShowModal(true)
  }

  const handleEditFields = (policyType: PolicyType) => {
    setEditingPolicyType(policyType)
    setShowFieldsModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tipo de póliza?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('policy_types')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadPolicyTypes()
    } catch (error) {
      console.error('Error deleting policy type:', error)
      alert('Error al eliminar el tipo de póliza')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('policy_types')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      await loadPolicyTypes()
    } catch (error) {
      console.error('Error updating policy type status:', error)
      alert('Error al actualizar el estado del tipo de póliza')
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Pólizas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona los tipos de pólizas y sus campos personalizados
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPolicyType(null)
            setShowModal(true)
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tipo de Póliza
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar tipos de póliza..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Policy Types List */}
      {filteredPolicyTypes.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Tipos de Pólizas ({filteredPolicyTypes.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredPolicyTypes.map((policyType) => (
              <div key={policyType.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <span className="text-2xl">{policyType.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {policyType.name}
                        </h4>
                        {!policyType.is_active && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactivo
                          </span>
                        )}
                      </div>
                      {policyType.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {policyType.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <p className="text-xs text-gray-500">
                          Orden: {policyType.sort_order}
                        </p>
                        <p className="text-xs text-gray-500">
                          Campos personalizados: {policyType.custom_fields?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditFields(policyType)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                      title="Configurar campos personalizados"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(policyType.id, policyType.is_active)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title={policyType.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {policyType.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(policyType)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(policyType.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tipos de póliza</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron resultados' : 'Comienza agregando tu primer tipo de póliza'}
          </p>
        </div>
      )}

      {/* Modal for Add/Edit Policy Type */}
      {showModal && (
        <PolicyTypeModal
          policyType={editingPolicyType}
          onClose={() => setShowModal(false)}
          onSave={() => {
            loadPolicyTypes()
            setShowModal(false)
          }}
        />
      )}

      {/* Modal for Custom Fields */}
      {showFieldsModal && (
        <CustomFieldsModal
          policyType={editingPolicyType}
          onClose={() => setShowFieldsModal(false)}
          onSave={() => {
            loadPolicyTypes()
            setShowFieldsModal(false)
          }}
        />
      )}
    </div>
  )
}

// Policy Type Modal Component
function PolicyTypeModal({ 
  policyType, 
  onClose, 
  onSave 
}: { 
  policyType: PolicyType | null
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: policyType?.name || '',
    description: policyType?.description || '',
    icon: policyType?.icon || '📋',
    is_active: policyType?.is_active ?? true,
    sort_order: policyType?.sort_order || 0,
    custom_fields: policyType?.custom_fields || [],
  })

  const commonIcons = [
    '📋', '❤️', '🚗', '🏍️', '🚲', '🏠', '🏥', '✈️', '🐕', '⚖️',
    '💼', '🔧', '🌟', '🛡️', '💰', '🎯', '📊', '🔒', '🌍', '⭐'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        agent_id: user!.id,
        // Si es un nuevo tipo de póliza, generar campos por defecto
        custom_fields: formData.custom_fields.length > 0 
          ? formData.custom_fields 
          : getDefaultCustomFields(formData.name)
      }

      if (policyType) {
        // Update existing
        const { error } = await supabase
          .from('policy_types')
          .update(dataToSave)
          .eq('id', policyType.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('policy_types')
          .insert([dataToSave])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving policy type:', error)
      alert('Error al guardar el tipo de póliza')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {policyType ? 'Editar Tipo de Póliza' : 'Nuevo Tipo de Póliza'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Seguro de Vida"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden de Visualización
              </label>
              <input
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del tipo de póliza..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icono
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl"
                />
                <span className="text-sm text-gray-600">o selecciona uno:</span>
              </div>
              <div className="grid grid-cols-10 gap-2">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-2 text-xl border rounded-lg hover:bg-blue-50 transition-colors duration-200 ${
                      formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Tipo de póliza activo</span>
              </label>
            </div>
          </div>

          {!policyType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Campos personalizados:</strong> Se generarán automáticamente campos específicos para este tipo de póliza. 
                Podrás personalizarlos después usando el botón de configuración.
              </p>
            </div>
          )}

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

// Custom Fields Modal Component
function CustomFieldsModal({ 
  policyType, 
  onClose, 
  onSave 
}: { 
  policyType: PolicyType | null
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [customFields, setCustomFields] = useState<CustomField[]>(
    policyType?.custom_fields || getDefaultCustomFields(policyType?.name || '')
  )

  const fieldTypes = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Fecha' },
    { value: 'select', label: 'Lista desplegable' },
    { value: 'textarea', label: 'Texto largo' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Teléfono' },
  ]

  const addField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
    }
    setCustomFields([...customFields, newField])
  }

  const updateField = (index: number, updates: Partial<CustomField>) => {
    const updated = [...customFields]
    updated[index] = { ...updated[index], ...updates }
    setCustomFields(updated)
  }

  const removeField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= customFields.length) return

    const updated = [...customFields]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setCustomFields(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('policy_types')
        .update({ custom_fields: customFields })
        .eq('id', policyType!.id)

      if (error) throw error
      onSave()
    } catch (error) {
      console.error('Error saving custom fields:', error)
      alert('Error al guardar los campos personalizados')
    } finally {
      setLoading(false)
    }
  }

  const loadDefaults = () => {
    if (confirm('¿Cargar campos por defecto? Esto reemplazará la configuración actual.')) {
      setCustomFields(getDefaultCustomFields(policyType?.name || ''))
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Campos Personalizados - {policyType?.icon} {policyType?.name}
            </h3>
            <p className="text-sm text-gray-600">
              Configura los campos específicos para este tipo de póliza
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">
              Campos ({customFields.length})
            </h4>
            <div className="space-x-2">
              <button
                type="button"
                onClick={loadDefaults}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cargar por Defecto
              </button>
              <button
                type="button"
                onClick={addField}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Agregar Campo
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {customFields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nombre del Campo *
                    </label>
                    <input
                      type="text"
                      required
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="ej: marca"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Etiqueta *
                    </label>
                    <input
                      type="text"
                      required
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="ej: Marca del Vehículo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as any })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {fieldTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 text-xs"
                      />
                      <span className="ml-1">Requerido</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Texto de ayuda"
                    />
                  </div>

                  {field.type === 'select' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Opciones (separadas por coma)
                      </label>
                      <input
                        type="text"
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => updateField(index, { 
                          options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt) 
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Opción 1, Opción 2, Opción 3"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300">
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === customFields.length - 1}
                      className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {customFields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay campos configurados.</p>
              <p className="text-sm">Haz clic en "Agregar Campo" o "Cargar por Defecto" para comenzar.</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              {loading ? 'Guardando...' : 'Guardar Campos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}