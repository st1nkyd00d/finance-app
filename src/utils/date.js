// Sumar meses respetando ultimo dia del mes (evita overflow: 31 ene + 1 mes = 28 feb, no 3 mar)
export function addMonths(date, months) {
  const result = new Date(date)
  const day = result.getDate()
  result.setMonth(result.getMonth() + months)
  if (result.getDate() !== day) {
    result.setDate(0) // ultimo dia del mes anterior
  }
  return result
}

// Crear fecha con dia clampeado al ultimo dia del mes (evita overflow)
export function safeDate(year, month, day) {
  const maxDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, maxDay))
}

// Texto relativo para fechas ("Hace 5 min", "Ayer", etc.)
export function getTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return 'Ayer'
  return `Hace ${diffDays} dias`
}
