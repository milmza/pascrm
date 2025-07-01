import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, DollarSign, Eye, EyeOff } from 'lucide-react'
import { supabase, Currency } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function CurrencyList() {
  const { user } = useAuth()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)

  useEffect(() => {
    if (user) {
      loadCurrencies()
    }
  }, [user])

  useEffect(() => {
    const filtered = currencies.filter(currency =>
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.symbol.includes(searchTerm)
    )
    setFilteredCurrencies(filtered)
  }, [currencies, searchTerm])

  const loadCurrencies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('agent_id', user!.id)
        .order('code', { ascending: true })

      if (error) throw error
      setCurrencies(data || [])
    } catch (error) {
      console.error('Error loading currencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta moneda?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadCurrencies()
    } catch (error) {
      console.error('Error deleting currency:', error)
      alert('Error al eliminar la moneda')
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('currencies')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      await loadCurrencies()
    } catch (error) {
      console.error('Error updating currency status:', error)
      alert('Error al actualizar el estado de la moneda')
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
          <h1 className="text-2xl font-bold text-gray-900">Monedas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona las monedas disponibles para tus pólizas y coberturas
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCurrency(null)
            setShowModal(true)
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Moneda
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar monedas por código, nombre o símbolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Currencies Grid */}
      {filteredCurrencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCurrencies.map((currency) => (
            <div key={currency.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        {currency.code}
                        {!currency.is_active && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactiva
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currency.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleStatus(currency.id, currency.is_active)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title={currency.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {currency.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(currency)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(currency.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {currency.symbol}
                  </div>
                  <p className="text-sm text-gray-600">
                    Símbolo de la moneda
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay monedas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron resultados' : 'Comienza agregando tu primera moneda'}
          </p>
        </div>
      )}

      {/* Modal for Add/Edit Currency */}
      {showModal && (
        <CurrencyModal
          currency={editingCurrency}
          onClose={() => setShowModal(false)}
          onSave={() => {
            loadCurrencies()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

// Currency Modal Component
function CurrencyModal({ 
  currency, 
  onClose, 
  onSave 
}: { 
  currency: Currency | null
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: currency?.code || '',
    name: currency?.name || '',
    symbol: currency?.symbol || '',
    is_active: currency?.is_active ?? true,
  })

  const commonCurrencies = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
    { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
    { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
    { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
    { code: 'UYU', name: 'Peso Uruguayo', symbol: '$' },
    { code: 'BOB', name: 'Boliviano', symbol: 'Bs' },
    { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
    { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
    { code: 'JPY', name: 'Yen Japonés', symbol: '¥' },
    { code: 'CAD', name: 'Dólar Canadiense', symbol: 'C$' },
    { code: 'CHF', name: 'Franco Suizo', symbol: 'CHF' },
    { code: 'CNY', name: 'Yuan Chino', symbol: '¥' },
  ]

  const handlePresetSelect = (preset: typeof commonCurrencies[0]) => {
    setFormData({
      ...formData,
      code: preset.code,
      name: preset.name,
      symbol: preset.symbol,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        code: formData.code.toUpperCase(),
        agent_id: user!.id,
      }

      if (currency) {
        // Update existing
        const { error } = await supabase
          .from('currencies')
          .update(dataToSave)
          .eq('id', currency.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('currencies')
          .insert([dataToSave])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving currency:', error)
      alert('Error al guardar la moneda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {currency ? 'Editar Moneda' : 'Nueva Moneda'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!currency && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monedas Comunes
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {commonCurrencies.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="p-2 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                  >
                    <div className="font-medium text-sm">{preset.code}</div>
                    <div className="text-xs text-gray-600">{preset.symbol}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código ISO *
              </label>
              <input
                type="text"
                required
                maxLength={3}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="USD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Símbolo *
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="$"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Activa</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Moneda *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dólar Estadounidense"
            />
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