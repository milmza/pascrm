import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, FileText, Calendar, DollarSign } from 'lucide-react'
import { supabase, Policy, Policyholder, InsuranceCompany, CoverageType, PolicyType, Currency, CustomField } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function PolicyList() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([])
  const [policyholders, setPolicyholders] = useState<Policyholder[]>([])
  const [companies, setCompanies] = useState<InsuranceCompany[]>([])
  const [coverageTypes, setCoverageTypes] = useState<CoverageType[]>([])
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    let filtered = policies

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(policy =>
        policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.insurance_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.policyholder && 
          `${policy.policyholder.first_name} ${policy.policyholder.last_name}`
            .toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(policy => 
        policy.policy_type === filterType || policy.policy_type_id === filterType
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(policy => policy.status === filterStatus)
    }

    setFilteredPolicies(filtered)
  }, [policies, searchTerm, filterType, filterStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load policies with related data
      const { data: policiesData, error: policiesError } = await supabase
        .from('policies')
        .select(`
          *,
          policyholder:policyholders(*),
          company:insurance_companies(*),
          coverage_type:coverage_types(*),
          policy_type_obj:policy_types(*)
        `)
        .eq('agent_id', user!.id)
        .order('created_at', { ascending: false })

      if (policiesError) throw policiesError

      // Load policyholders for the form
      const { data: policyholdersData, error: policyholdersError } = await supabase
        .from('policyholders')
        .select('*')
        .eq('agent_id', user!.id)
        .order('first_name', { ascending: true })

      if (policyholdersError) throw policyholdersError

      // Load companies for the form
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('agent_id', user!.id)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (companiesError) throw companiesError

      // Load coverage types for the form
      const { data: coverageData, error: coverageError } = await supabase
        .from('coverage_types')
        .select(`
          *,
          company:insurance_companies(*)
        `)
        .eq('agent_id', user!.id)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (coverageError) throw coverageError

      // Load policy types
      const { data: policyTypesData, error: policyTypesError } = await supabase
        .from('policy_types')
        .select('*')
        .eq('agent_id', user!.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (policyTypesError) throw policyTypesError

      // Load currencies
      const { data: currenciesData, error: currenciesError } = await supabase
        .from('currencies')
        .select('*')
        .eq('agent_id', user!.id)
        .eq('is_active', true)
        .order('code', { ascending: true })

      if (currenciesError) throw currenciesError

      setPolicies(policiesData || [])
      setPolicyholders(policyholdersData || [])
      setCompanies(companiesData || [])
      setCoverageTypes(coverageData || [])
      setPolicyTypes(policyTypesData || [])
      setCurrencies(currenciesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta póliza?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting policy:', error)
      alert('Error al eliminar la póliza')
    }
  }

  const formatCurrency = (amount: number, currencyCode: string = 'EUR') => {
    const currency = currencies.find(c => c.code === currencyCode)
    const symbol = currency?.symbol || currencyCode
    
    return new Intl.NumberFormat('es-ES', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + symbol
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activa':
        return 'bg-green-100 text-green-800'
      case 'vencida':
        return 'bg-red-100 text-red-800'
      case 'cancelada':
        return 'bg-gray-100 text-gray-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeDisplay = (policy: Policy) => {
    if (policy.policy_type_obj) {
      return {
        icon: policy.policy_type_obj.icon,
        name: policy.policy_type_obj.name
      }
    }
    
    // Fallback to legacy policy_type
    const typeIcons: Record<string, string> = {
      vida: '❤️',
      auto: '🚗',
      moto: '🏍️',
      bicicleta: '🚲',
      hogar: '🏠',
      otro: '📋'
    }
    
    return {
      icon: typeIcons[policy.policy_type] || '📋',
      name: policy.policy_type.charAt(0).toUpperCase() + policy.policy_type.slice(1)
    }
  }

  const getCustomFieldValue = (policy: Policy, fieldName: string) => {
    return policy.custom_data?.[fieldName] || ''
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
          <h1 className="text-2xl font-bold text-gray-900">Pólizas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona las pólizas de seguros de tus clientes
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPolicy(null)
            setShowModal(true)
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Póliza
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
              placeholder="Buscar por número, compañía o asegurado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="form-element px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Todos los tipos</option>
          {policyTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.icon} {type.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-element px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="vencida">Vencida</option>
          <option value="cancelada">Cancelada</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </div>

      {/* Policies Grid */}
      {filteredPolicies.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => {
            const typeDisplay = getTypeDisplay(policy)
            return (
              <div key={policy.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {typeDisplay.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {policy.policy_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {typeDisplay.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(policy)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {policy.policyholder?.first_name} {policy.policyholder?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {policy.company?.name || policy.insurance_company}
                      </p>
                      {policy.coverage_type && (
                        <p className="text-xs text-gray-500">
                          {policy.coverage_type.name}
                        </p>
                      )}
                    </div>

                    {/* Custom Fields Preview */}
                    {policy.policy_type_obj?.custom_fields && policy.custom_data && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Detalles del Bien Asegurado</h5>
                        <div className="space-y-1">
                          {policy.policy_type_obj.custom_fields.slice(0, 3).map((field) => {
                            const value = getCustomFieldValue(policy, field.name)
                            if (!value) return null
                            return (
                              <div key={field.id} className="flex justify-between text-xs">
                                <span className="text-gray-600">{field.label}:</span>
                                <span className="text-gray-900 font-medium">{value}</span>
                              </div>
                            )
                          })}
                          {policy.policy_type_obj.custom_fields.length > 3 && (
                            <p className="text-xs text-gray-500 italic">
                              +{policy.policy_type_obj.custom_fields.length - 3} campos más
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                        {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                      </span>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatCurrency(policy.premium_amount, policy.currency_code)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Vence: {formatDate(policy.end_date)}
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {policy.payment_frequency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pólizas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
              ? 'No se encontraron resultados con los filtros actuales' 
              : 'Comienza agregando tu primera póliza'
            }
          </p>
        </div>
      )}

      {/* Modal for Add/Edit Policy */}
      {showModal && (
        <PolicyModal
          policy={editingPolicy}
          policyholders={policyholders}
          companies={companies}
          coverageTypes={coverageTypes}
          policyTypes={policyTypes}
          currencies={currencies}
          onClose={() => setShowModal(false)}
          onSave={() => {
            loadData()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

// Policy Modal Component
function PolicyModal({ 
  policy, 
  policyholders,
  companies,
  coverageTypes,
  policyTypes,
  currencies,
  onClose, 
  onSave 
}: { 
  policy: Policy | null
  policyholders: Policyholder[]
  companies: InsuranceCompany[]
  coverageTypes: CoverageType[]
  policyTypes: PolicyType[]
  currencies: Currency[]
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    policy_number: policy?.policy_number || '',
    policyholder_id: policy?.policyholder_id || '',
    policy_type: policy?.policy_type || '',
    policy_type_id: policy?.policy_type_id || '',
    company_id: policy?.company_id || '',
    coverage_type_id: policy?.coverage_type_id || '',
    insurance_company: policy?.insurance_company || '',
    start_date: policy?.start_date || '',
    end_date: policy?.end_date || '',
    premium_amount: policy?.premium_amount || 0,
    currency_code: policy?.currency_code || 'EUR',
    payment_frequency: policy?.payment_frequency || 'mensual',
    coverage_details: policy?.coverage_details || {},
    custom_data: policy?.custom_data || {},
    status: policy?.status || 'activa',
  })

  // Get selected policy type and its custom fields
  const selectedPolicyType = policyTypes.find(pt => pt.id === formData.policy_type_id)
  const customFields = selectedPolicyType?.custom_fields || []

  // Filter coverage types based on selected company and policy type
  const availableCoverageTypes = coverageTypes.filter(ct => {
    const matchesCompany = !formData.company_id || ct.company_id === formData.company_id
    const matchesType = !selectedPolicyType || ct.policy_type === selectedPolicyType.name.toLowerCase()
    return matchesCompany && matchesType
  })

  const handleCompanyChange = (companyId: string) => {
    const selectedCompany = companies.find(c => c.id === companyId)
    setFormData({
      ...formData,
      company_id: companyId,
      insurance_company: selectedCompany?.name || '',
      coverage_type_id: '', // Reset coverage type when company changes
    })
  }

  const handlePolicyTypeChange = (policyTypeId: string) => {
    const selectedType = policyTypes.find(pt => pt.id === policyTypeId)
    setFormData({
      ...formData,
      policy_type_id: policyTypeId,
      policy_type: selectedType?.name.toLowerCase() || '',
      coverage_type_id: '', // Reset coverage type when policy type changes
      custom_data: {}, // Reset custom data when policy type changes
    })
  }

  const handleCoverageTypeChange = (coverageTypeId: string) => {
    const selectedCoverage = coverageTypes.find(ct => ct.id === coverageTypeId)
    setFormData({
      ...formData,
      coverage_type_id: coverageTypeId,
      premium_amount: selectedCoverage?.base_premium || formData.premium_amount,
      currency_code: selectedCoverage?.currency_code || formData.currency_code,
    })
  }

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData({
      ...formData,
      custom_data: {
        ...formData.custom_data,
        [fieldName]: value
      }
    })
  }

  const renderCustomField = (field: CustomField) => {
    const value = formData.custom_data[field.name] || ''

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
            className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required={field.required}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
            className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.name, parseFloat(e.target.value) || '')}
            className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
            className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        )

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
            className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder}
            required={field.required}
            pattern={field.validation?.pattern}
          />
        )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        agent_id: user!.id,
      }

      if (policy) {
        // Update existing
        const { error } = await supabase
          .from('policies')
          .update(dataToSave)
          .eq('id', policy.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('policies')
          .insert([dataToSave])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving policy:', error)
      alert('Error al guardar la póliza')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="modal-content relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {policy ? 'Editar Póliza' : 'Nueva Póliza'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Información Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Póliza *
                </label>
                <input
                  type="text"
                  required
                  value={formData.policy_number}
                  onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asegurado *
                </label>
                <select
                  required
                  value={formData.policyholder_id}
                  onChange={(e) => setFormData({ ...formData, policyholder_id: e.target.value })}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccionar asegurado</option>
                  {policyholders.map((ph) => (
                    <option key={ph.id} value={ph.id}>
                      {ph.first_name} {ph.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Seguro *
                </label>
                <select
                  required
                  value={formData.policy_type_id}
                  onChange={(e) => handlePolicyTypeChange(e.target.value)}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccionar tipo</option>
                  {policyTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compañía Aseguradora
                </label>
                <select
                  value={formData.company_id}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccionar compañía</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {!formData.company_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Compañía (Manual)
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_company}
                    onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                    className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la compañía"
                  />
                </div>
              )}

              {availableCoverageTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Cobertura
                  </label>
                  <select
                    value={formData.coverage_type_id}
                    onChange={(e) => handleCoverageTypeChange(e.target.value)}
                    className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Seleccionar cobertura</option>
                    {availableCoverageTypes.map((coverage) => (
                      <option key={coverage.id} value={coverage.id}>
                        {coverage.name} {coverage.base_premium > 0 && `- ${coverage.base_premium} ${coverage.currency_code}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto de Prima *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.premium_amount}
                  onChange={(e) => setFormData({ ...formData, premium_amount: parseFloat(e.target.value) || 0 })}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda *
                </label>
                <select
                  required
                  value={formData.currency_code}
                  onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia de Pago *
                </label>
                <select
                  required
                  value={formData.payment_frequency}
                  onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value as any })}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="form-element w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="activa">Activa</option>
                  <option value="vencida">Vencida</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                {selectedPolicyType?.icon} Información del Bien Asegurado
                <span className="ml-2 text-sm text-gray-500">({selectedPolicyType?.name})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && '*'}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </div>
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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}