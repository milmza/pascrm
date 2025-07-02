// ... (existing imports remain the same)

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
        first_name: null,    // Ensure null instead of empty string
        last_name: null,     // Ensure null instead of empty string
        date_of_birth: null,
      })
    }

    // Clean empty strings to null for database consistency
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === '') {
        dataToSave[key] = null
      }
    })

    // Rest of the function remains the same...
