import React, { useState } from 'react'
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { exportToExcel, importFromExcel } from '../utils/excelUtils'

export default function BackupManager() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      
      // Load all data
      const [
        { data: policyholders },
        { data: policies },
        { data: companies },
        { data: policyTypes },
        { data: currencies }
      ] = await Promise.all([
        supabase.from('policyholders').select('*').eq('agent_id', user!.id),
        supabase.from('policies').select(`
          *,
          policyholder:policyholders(*)
        `).eq('agent_id', user!.id),
        supabase.from('insurance_companies').select('*').eq('agent_id', user!.id),
        supabase.from('policy_types').select('*').eq('agent_id', user!.id),
        supabase.from('currencies').select('*').eq('agent_id', user!.id)
      ])

      exportToExcel({
        policyholders: policyholders || [],
        policies: policies || [],
        companies: companies || [],
        policyTypes: policyTypes || [],
        currencies: currencies || []
      })

      showMessage('Copia de seguridad exportada exitosamente', 'success')
    } catch (error) {
      console.error('Error exporting data:', error)
      showMessage('Error al exportar la copia de seguridad', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      
      const data = await importFromExcel(file)
      
      let importedCount = 0

      // Import currencies first (they're referenced by other tables)
      if (data.currencies.length > 0) {
        const currenciesWithAgent = data.currencies.map(c => ({ ...c, agent_id: user!.id }))
        const { error } = await supabase
          .from('currencies')
          .upsert(currenciesWithAgent, { onConflict: 'agent_id,code' })
        
        if (!error) importedCount += data.currencies.length
      }

      // Import policy types
      if (data.policyTypes.length > 0) {
        const policyTypesWithAgent = data.policyTypes.map(pt => ({ ...pt, agent_id: user!.id }))
        const { error } = await supabase
          .from('policy_types')
          .upsert(policyTypesWithAgent, { onConflict: 'agent_id,name' })
        
        if (!error) importedCount += data.policyTypes.length
      }

      // Import companies
      if (data.companies.length > 0) {
        const companiesWithAgent = data.companies.map(c => ({ ...c, agent_id: user!.id }))
        const { error } = await supabase
          .from('insurance_companies')
          .insert(companiesWithAgent)
        
        if (!error) importedCount += data.companies.length
      }

      // Import policyholders
      if (data.policyholders.length > 0) {
        const policyholdersWithAgent = data.policyholders.map(p => ({ ...p, agent_id: user!.id }))
        const { error } = await supabase
          .from('policyholders')
          .insert(policyholdersWithAgent)
        
        if (!error) importedCount += data.policyholders.length
      }

      showMessage(`Importación completada. ${importedCount} registros importados.`, 'success')
      
      // Reset file input
      event.target.value = ''
      
    } catch (error) {
      console.error('Error importing data:', error)
      showMessage('Error al importar la copia de seguridad. Verifique el formato del archivo.', 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <FileSpreadsheet className="w-6 h-6 text-blue-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">Copia de Seguridad</h3>
          <p className="text-sm text-gray-600">
            Exporta e importa todos tus datos en formato Excel
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          )}
          <span className="text-sm">{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Exportar Datos</h4>
          <p className="text-sm text-gray-600 mb-4">
            Descarga todos tus datos en un archivo Excel para crear una copia de seguridad.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Exportando...' : 'Exportar a Excel'}
          </button>
        </div>

        {/* Import */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Importar Datos</h4>
          <p className="text-sm text-gray-600 mb-4">
            Importa datos desde un archivo Excel exportado previamente.
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              disabled={importing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button
              disabled={importing}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {importing ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {importing ? 'Importando...' : 'Seleccionar Archivo Excel'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>La importación agregará nuevos registros sin eliminar los existentes</li>
              <li>Los registros duplicados se actualizarán automáticamente</li>
              <li>Asegúrate de que el archivo Excel tenga el formato correcto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}