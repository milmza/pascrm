import * as XLSX from 'xlsx'
import { Policyholder, Policy, InsuranceCompany, PolicyType, Currency } from '../lib/supabase'

// Export data to Excel
export const exportToExcel = (data: {
  policyholders: Policyholder[]
  policies: Policy[]
  companies: InsuranceCompany[]
  policyTypes: PolicyType[]
  currencies: Currency[]
}) => {
  const workbook = XLSX.utils.book_new()

  // Format policyholders data
  const policyholdersData = data.policyholders.map(p => ({
    'Tipo de Entidad': p.entity_type === 'fisico' ? 'Persona Física' : 'Persona Jurídica',
    'Nombre': p.first_name || '',
    'Apellido': p.last_name || '',
    'Razón Social': p.business_name || '',
    'Tipo de Empresa': p.business_type || '',
    'Representante Legal': p.legal_representative || '',
    'DNI': p.dni || '',
    'CUIL/CUIT': p.cuil_cuit || '',
    'Email': p.email || '',
    'Teléfono': p.phone || '',
    'Dirección': p.address || '',
    'Ciudad': p.city || '',
    'Provincia/Estado': p.state || '',
    'Código Postal': p.postal_code || '',
    'Fecha de Nacimiento': p.date_of_birth || '',
    'Fecha de Creación': new Date(p.created_at).toLocaleDateString('es-ES'),
  }))

  // Format policies data
  const policiesData = data.policies.map(p => ({
    'Número de Póliza': p.policy_number,
    'Asegurado': p.policyholder ? 
      (p.policyholder.entity_type === 'fisico' 
        ? `${p.policyholder.first_name} ${p.policyholder.last_name}`
        : p.policyholder.business_name) : '',
    'Tipo de Póliza': p.policy_type,
    'Compañía Aseguradora': p.insurance_company,
    'Fecha de Inicio': p.start_date,
    'Fecha de Vencimiento': p.end_date,
    'Monto de Prima': p.premium_amount,
    'Moneda': p.currency_code,
    'Frecuencia de Pago': p.payment_frequency,
    'Estado': p.status,
    'Fecha de Creación': new Date(p.created_at).toLocaleDateString('es-ES'),
  }))

  // Format companies data
  const companiesData = data.companies.map(c => ({
    'Nombre': c.name,
    'Descripción': c.description || '',
    'Email de Contacto': c.contact_email || '',
    'Teléfono de Contacto': c.contact_phone || '',
    'Sitio Web': c.website || '',
    'Activa': c.is_active ? 'Sí' : 'No',
    'Fecha de Creación': new Date(c.created_at).toLocaleDateString('es-ES'),
  }))

  // Format policy types data
  const policyTypesData = data.policyTypes.map(pt => ({
    'Nombre': pt.name,
    'Descripción': pt.description || '',
    'Icono': pt.icon,
    'Orden': pt.sort_order,
    'Activo': pt.is_active ? 'Sí' : 'No',
    'Campos Personalizados': JSON.stringify(pt.custom_fields),
    'Fecha de Creación': new Date(pt.created_at).toLocaleDateString('es-ES'),
  }))

  // Format currencies data
  const currenciesData = data.currencies.map(c => ({
    'Código': c.code,
    'Nombre': c.name,
    'Símbolo': c.symbol,
    'Activa': c.is_active ? 'Sí' : 'No',
    'Fecha de Creación': new Date(c.created_at).toLocaleDateString('es-ES'),
  }))

  // Create worksheets
  const policyholdersWS = XLSX.utils.json_to_sheet(policyholdersData)
  const policiesWS = XLSX.utils.json_to_sheet(policiesData)
  const companiesWS = XLSX.utils.json_to_sheet(companiesData)
  const policyTypesWS = XLSX.utils.json_to_sheet(policyTypesData)
  const currenciesWS = XLSX.utils.json_to_sheet(currenciesData)

  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(workbook, policyholdersWS, 'Asegurados')
  XLSX.utils.book_append_sheet(workbook, policiesWS, 'Pólizas')
  XLSX.utils.book_append_sheet(workbook, companiesWS, 'Compañías')
  XLSX.utils.book_append_sheet(workbook, policyTypesWS, 'Tipos de Póliza')
  XLSX.utils.book_append_sheet(workbook, currenciesWS, 'Monedas')

  // Generate filename with current date
  const now = new Date()
  const filename = `CRM_Seguros_Backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`

  // Save file
  XLSX.writeFile(workbook, filename)
}

// Import data from Excel
export const importFromExcel = (file: File): Promise<{
  policyholders: any[]
  policies: any[]
  companies: any[]
  policyTypes: any[]
  currencies: any[]
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        const result = {
          policyholders: [],
          policies: [],
          companies: [],
          policyTypes: [],
          currencies: []
        }

        // Parse each sheet if it exists
        if (workbook.SheetNames.includes('Asegurados')) {
          const ws = workbook.Sheets['Asegurados']
          const jsonData = XLSX.utils.sheet_to_json(ws)
          result.policyholders = jsonData.map((row: any) => ({
            entity_type: row['Tipo de Entidad'] === 'Persona Física' ? 'fisico' : 'juridico',
            first_name: row['Nombre'] || null,
            last_name: row['Apellido'] || null,
            business_name: row['Razón Social'] || null,
            business_type: row['Tipo de Empresa'] || null,
            legal_representative: row['Representante Legal'] || null,
            dni: row['DNI'] || null,
            cuil_cuit: row['CUIL/CUIT'] || null,
            email: row['Email'] || null,
            phone: row['Teléfono'] || null,
            address: row['Dirección'] || null,
            city: row['Ciudad'] || null,
            state: row['Provincia/Estado'] || null,
            postal_code: row['Código Postal'] || null,
            date_of_birth: row['Fecha de Nacimiento'] || null,
          }))
        }

        if (workbook.SheetNames.includes('Compañías')) {
          const ws = workbook.Sheets['Compañías']
          const jsonData = XLSX.utils.sheet_to_json(ws)
          result.companies = jsonData.map((row: any) => ({
            name: row['Nombre'],
            description: row['Descripción'] || null,
            contact_email: row['Email de Contacto'] || null,
            contact_phone: row['Teléfono de Contacto'] || null,
            website: row['Sitio Web'] || null,
            is_active: row['Activa'] === 'Sí',
          }))
        }

        if (workbook.SheetNames.includes('Tipos de Póliza')) {
          const ws = workbook.Sheets['Tipos de Póliza']
          const jsonData = XLSX.utils.sheet_to_json(ws)
          result.policyTypes = jsonData.map((row: any) => ({
            name: row['Nombre'],
            description: row['Descripción'] || null,
            icon: row['Icono'] || '📋',
            sort_order: row['Orden'] || 0,
            is_active: row['Activo'] === 'Sí',
            custom_fields: row['Campos Personalizados'] ? JSON.parse(row['Campos Personalizados']) : [],
          }))
        }

        if (workbook.SheetNames.includes('Monedas')) {
          const ws = workbook.Sheets['Monedas']
          const jsonData = XLSX.utils.sheet_to_json(ws)
          result.currencies = jsonData.map((row: any) => ({
            code: row['Código'],
            name: row['Nombre'],
            symbol: row['Símbolo'],
            is_active: row['Activa'] === 'Sí',
          }))
        }

        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsArrayBuffer(file)
  })
}