import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Building2, Phone, Mail, Globe, Eye, EyeOff } from 'lucide-react'
import { supabase, InsuranceCompany, CoverageType } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function InsuranceCompanyList() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<InsuranceCompany[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<InsuranceCompany[]>([])
  const [coverageTypes, setCoverageTypes] = useState<CoverageType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCoverageModal, setShowCoverageModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null)
  const [editingCoverage, setEditingCoverage] = useState<CoverageType | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCompanies(filtered)
  }, [companies, searchTerm])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('agent_id', user!.id)
        .order('name', { ascending: true })

      if (companiesError) throw companiesError

      // Load coverage types
      const { data: coverageData, error: coverageError } = await supabase
        .from('coverage_types')
        .select(`
          *,
          company:insurance_companies(*)
        `)
        .eq('agent_id', user!.id)
        .order('name', { ascending: true })

      if (coverageError) throw coverageError

      setCompanies(companiesData || [])
      setCoverageTypes(coverageData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCompany = (company: InsuranceCompany) => {
    setEditingCompany(company)
    setShowModal(true)
  }

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta compañía? También se eliminarán todas sus coberturas.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('insurance_companies')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Error al eliminar la compañía')
    }
  }

  const handleEditCoverage = (coverage: CoverageType) => {
    setEditingCoverage(coverage)
    setSelectedCompanyId(coverage.company_id)
    setShowCoverageModal(true)
  }

  const handleDeleteCoverage = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cobertura?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('coverage_types')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting coverage:', error)
      alert('Error al eliminar la cobertura')
    }
  }

  const toggleCompanyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('insurance_companies')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error updating company status:', error)
      alert('Error al actualizar el estado de la compañía')
    }
  }

  const getCompanyCoverageCount = (companyId: string) => {
    return coverageTypes.filter(ct => ct.company_id === companyId).length
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
          <h1 className="text-2xl font-bold text-gray-900">Compañías Aseguradoras</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona las compañías aseguradoras y sus tipos de cobertura
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => {
              setEditingCoverage(null)
              setSelectedCompanyId('')
              setShowCoverageModal(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cobertura
          </button>
          <button
            onClick={() => {
              setEditingCompany(null)
              setShowModal(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Compañía
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar compañías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        {company.name}
                        {!company.is_active && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactiva
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getCompanyCoverageCount(company.id)} coberturas
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleCompanyStatus(company.id, company.is_active)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title={company.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {company.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEditCompany(company)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {company.description && (
                  <p className="text-sm text-gray-600 mb-4">{company.description}</p>
                )}

                <div className="space-y-2">
                  {company.contact_email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {company.contact_email}
                    </div>
                  )}
                  {company.contact_phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {company.contact_phone}
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Coverage Types */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Coberturas Disponibles</h4>
                  <div className="space-y-2">
                    {coverageTypes
                      .filter(ct => ct.company_id === company.id)
                      .slice(0, 3)
                      .map((coverage) => (
                        <div key={coverage.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{coverage.name}</p>
                            <p className="text-xs text-gray-600 capitalize">{coverage.policy_type}</p>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditCoverage(coverage)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoverage(coverage.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    {getCompanyCoverageCount(company.id) > 3 && (
                      <p className="text-xs text-gray-500">
                        +{getCompanyCoverageCount(company.id) - 3} coberturas más
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay compañías</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron resultados' : 'Comienza agregando tu primera compañía aseguradora'}
          </p>
        </div>
      )}

      {/* Company Modal */}
      {showModal && (
        <CompanyModal
          company={editingCompany}
          onClose={() => setShowModal(false)}
          onSave={() => {
            loadData()
            setShowModal(false)
          }}
        />
      )}

      {/* Coverage Modal */}
      {showCoverageModal && (
        <CoverageModal
          coverage={editingCoverage}
          companies={companies.filter(c => c.is_active)}
          selectedCompanyId={selectedCompanyId}
          onClose={() => setShowCoverageModal(false)}
          onSave={() => {
            loadData()
            setShowCoverageModal(false)
          }}
        />
      )}
    </div>
  )
}

// Company Modal Component
function CompanyModal({ 
  company, 
  onClose, 
  onSave 
}: { 
  company: InsuranceCompany | null
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: company?.name || '',
    description: company?.description || '',
    contact_email: company?.contact_email || '',
    contact_phone: company?.contact_phone || '',
    website: company?.website || '',
    is_active: company?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        agent_id: user!.id,
      }

      if (company) {
        // Update existing
        const { error } = await supabase
          .from('insurance_companies')
          .update(dataToSave)
          .eq('id', company.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('insurance_companies')
          .insert([dataToSave])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving company:', error)
      alert('Error al guardar la compañía')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {company ? 'Editar Compañía' : 'Nueva Compañía'}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Compañía *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                placeholder="Descripción de la compañía..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Contacto
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitio Web
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Compañía activa</span>
              </label>
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

// Coverage Modal Component
function CoverageModal({ 
  coverage, 
  companies,
  selectedCompanyId,
  onClose, 
  onSave 
}: { 
  coverage: CoverageType | null
  companies: InsuranceCompany[]
  selectedCompanyId: string
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_id: coverage?.company_id || selectedCompanyId || '',
    name: coverage?.name || '',
    description: coverage?.description || '',
    policy_type: coverage?.policy_type || 'vida' as const,
    base_premium: coverage?.base_premium || 0,
    is_active: coverage?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        agent_id: user!.id,
      }

      if (coverage) {
        // Update existing
        const { error } = await supabase
          .from('coverage_types')
          .update(dataToSave)
          .eq('id', coverage.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('coverage_types')
          .insert([dataToSave])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving coverage:', error)
      alert('Error al guardar la cobertura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {coverage ? 'Editar Cobertura' : 'Nueva Cobertura'}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compañía *
              </label>
              <select
                required
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar compañía</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Cobertura *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Póliza *
              </label>
              <select
                required
                value={formData.policy_type}
                onChange={(e) => setFormData({ ...formData, policy_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="vida">Vida</option>
                <option value="auto">Auto</option>
                <option value="moto">Moto</option>
                <option value="bicicleta">Bicicleta</option>
                <option value="hogar">Hogar</option>
                <option value="otro">Otro</option>
              </select>
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
                placeholder="Descripción de la cobertura..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prima Base (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.base_premium}
                onChange={(e) => setFormData({ ...formData, base_premium: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center mt-6">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Cobertura activa</span>
              </label>
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