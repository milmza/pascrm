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
          //first_name: null, // Remove this line
          //last_name: null,  // Remove this line
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
                  Estado/Provincia
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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
