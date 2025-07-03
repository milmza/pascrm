// Format names according to requirements
export const formatName = (name: string): string => {
  if (!name) return ''
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

export const formatLastName = (lastName: string): string => {
  if (!lastName) return ''
  return lastName.toUpperCase()
}

export const formatBusinessName = (businessName: string): string => {
  if (!businessName) return ''
  return businessName.toUpperCase()
}

export const formatPolicyholderName = (policyholder: any): string => {
  if (!policyholder) return 'Sin asegurado'
  
  if (policyholder.entity_type === 'fisico') {
    const firstName = formatName(policyholder.first_name || '')
    const lastName = formatLastName(policyholder.last_name || '')
    return `${firstName} ${lastName}`.trim()
  } else {
    return formatBusinessName(policyholder.business_name || 'Sin nombre')
  }
}

// WhatsApp utilities
export const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return ''
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // If phone doesn't start with country code, assume it's Argentina (+54)
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
    return `54${cleanPhone}`
  }
  
  return cleanPhone
}

export const openWhatsApp = (phone: string, message?: string) => {
  const formattedPhone = formatPhoneForWhatsApp(phone)
  if (!formattedPhone) {
    alert('Número de teléfono no válido')
    return
  }
  
  const encodedMessage = message ? encodeURIComponent(message) : ''
  const url = `https://wa.me/${formattedPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`
  
  window.open(url, '_blank')
}

// Birthday utilities
export const getBirthdaysThisWeek = (policyholders: any[]): any[] => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return policyholders.filter(policyholder => {
    if (policyholder.entity_type !== 'fisico' || !policyholder.date_of_birth) {
      return false
    }
    
    const birthDate = new Date(policyholder.date_of_birth)
    const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())
    
    // If birthday already passed this year, check next year
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(currentYear + 1)
    }
    
    return thisYearBirthday >= today && thisYearBirthday <= oneWeekFromNow
  })
}

export const getDaysUntilBirthday = (dateOfBirth: string): number => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  const currentYear = today.getFullYear()
  const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())
  
  // If birthday already passed this year, calculate for next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(currentYear + 1)
  }
  
  const diffTime = thisYearBirthday.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}