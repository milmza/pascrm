import React, { useEffect, useState } from 'react'
import { Calendar, Gift, User, Phone } from 'lucide-react'
import { supabase, Policyholder } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getBirthdaysThisWeek, getDaysUntilBirthday, formatPolicyholderName } from '../utils/formatUtils'
import { openWhatsApp } from '../utils/formatUtils'

export default function BirthdayNotifications() {
  const { user } = useAuth()
  const [birthdayPeople, setBirthdayPeople] = useState<Policyholder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadBirthdays()
    }
  }, [user])

  const loadBirthdays = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('policyholders')
        .select('*')
        .eq('agent_id', user!.id)
        .eq('entity_type', 'fisico')
        .not('date_of_birth', 'is', null)

      if (error) throw error

      const birthdays = getBirthdaysThisWeek(data || [])
      setBirthdayPeople(birthdays)
    } catch (error) {
      console.error('Error loading birthdays:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppBirthday = (person: Policyholder) => {
    const name = formatPolicyholderName(person)
    const message = `¡Hola ${name}! 🎉 Te deseo un muy feliz cumpleaños. Que tengas un día maravilloso lleno de alegría y bendiciones. ¡Saludos!`
    
    if (person.phone) {
      openWhatsApp(person.phone, message)
    } else {
      alert('Esta persona no tiene número de teléfono registrado')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Gift className="w-6 h-6 text-pink-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Cumpleaños de la Semana</h3>
        </div>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
        </div>
      </div>
    )
  }

  if (birthdayPeople.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Gift className="w-6 h-6 text-pink-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Cumpleaños de la Semana</h3>
        </div>
        <div className="text-center py-4">
          <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No hay cumpleaños esta semana</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Gift className="w-6 h-6 text-pink-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Cumpleaños de la Semana</h3>
            <p className="text-sm text-gray-600">
              {birthdayPeople.length} {birthdayPeople.length === 1 ? 'persona cumple' : 'personas cumplen'} años esta semana
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {birthdayPeople.map((person) => {
          const daysUntil = getDaysUntilBirthday(person.date_of_birth!)
          const isToday = daysUntil === 0
          
          return (
            <div
              key={person.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                isToday 
                  ? 'bg-pink-50 border-pink-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isToday ? 'bg-pink-100' : 'bg-blue-100'
                }`}>
                  <User className={`w-5 h-5 ${
                    isToday ? 'text-pink-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-900">
                    {formatPolicyholderName(person)}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      {isToday ? '¡Hoy cumple años!' : `${formatDate(person.date_of_birth!)} (en ${daysUntil} ${daysUntil === 1 ? 'día' : 'días'})`}
                    </span>
                  </div>
                </div>
              </div>

              {person.phone && (
                <button
                  onClick={() => handleWhatsAppBirthday(person)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isToday
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  title="Enviar felicitación por WhatsApp"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  {isToday ? '¡Felicitar!' : 'WhatsApp'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}