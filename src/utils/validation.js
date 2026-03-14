// Utilidades de validación para formularios

/**
 * Valida y formatea un monto numérico
 * @param {string|number} value - Valor a validar
 * @param {number} maxDigits - Máximo de dígitos enteros (default: 9)
 * @param {number} maxDecimals - Máximo de decimales (default: 2)
 * @returns {object} { valid: boolean, value: number|null, error: string|null }
 */
export function validateAmount(value, maxDigits = 9, maxDecimals = 2) {
  if (!value || value === '') {
    return { valid: false, value: null, error: 'Ingresa un monto' }
  }

  const num = parseFloat(value)

  // Verificar que es un número válido
  if (isNaN(num)) {
    return { valid: false, value: null, error: 'Ingresa un monto válido' }
  }

  // Verificar que es positivo
  if (num <= 0) {
    return { valid: false, value: null, error: 'El monto debe ser mayor a 0' }
  }

  // Verificar límite superior
  const maxValue = Math.pow(10, maxDigits) - 0.01
  if (num > maxValue) {
    return {
      valid: false,
      value: null,
      error: `El monto máximo es ${maxValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`
    }
  }

  // Verificar decimales
  const decimalPart = value.toString().split('.')[1]
  if (decimalPart && decimalPart.length > maxDecimals) {
    return {
      valid: false,
      value: null,
      error: `Máximo ${maxDecimals} decimales permitidos`
    }
  }

  // Redondear a los decimales permitidos
  const rounded = Math.round(num * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals)

  return { valid: true, value: rounded, error: null }
}

/**
 * Valida longitud de texto
 * @param {string} value - Texto a validar
 * @param {number} maxLength - Longitud máxima
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validateTextLength(value, maxLength, fieldName = 'Este campo') {
  const trimmed = value.trim()

  if (!trimmed) {
    return { valid: false, error: `${fieldName} es obligatorio` }
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} no puede tener más de ${maxLength} caracteres (actual: ${trimmed.length})`
    }
  }

  return { valid: true, error: null }
}

/**
 * Constantes de validación
 */
export const VALIDATION_LIMITS = {
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
  AMOUNT_MAX_DIGITS: 9,
  AMOUNT_MAX_DECIMALS: 2,
  AMOUNT_MAX_VALUE: 999999999.99,
}

/**
 * Formatea un input de monto para prevenir input inválido
 * @param {string} value - Valor del input
 * @param {number} maxDecimals - Máximo de decimales
 * @returns {string} Valor formateado
 */
export function formatAmountInput(value, maxDecimals = 2) {
  // Permitir solo números y un punto decimal
  let formatted = value.replace(/[^\d.]/g, '')

  // Permitir solo un punto decimal
  const parts = formatted.split('.')
  if (parts.length > 2) {
    formatted = parts[0] + '.' + parts.slice(1).join('')
  }

  // Limitar decimales
  if (parts.length === 2 && parts[1].length > maxDecimals) {
    formatted = parts[0] + '.' + parts[1].slice(0, maxDecimals)
  }

  return formatted
}
