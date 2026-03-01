import { createContext, useCallback, useContext, useState, useEffect, useMemo } from 'react'

const ThemeContext = createContext(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Verificar localStorage
    const saved = localStorage.getItem('theme')
    if (saved) return saved

    // Verificar preferencia del sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement

    // Asegurar que solo una clase este presente
    root.classList.remove('dark', 'light')

    if (theme === 'dark') {
      root.classList.add('dark')
    }
    // No guardar en localStorage aqui — solo en acciones explicitas del usuario
    // para que la deteccion automatica del sistema siga funcionando
  }, [theme])

  // Escuchar cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function handleChange(e) {
      const savedTheme = localStorage.getItem('theme')
      // Solo cambiar si el usuario no ha elegido manualmente
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      return next
    })
  }, [])

  const setLightTheme = useCallback(() => {
    localStorage.setItem('theme', 'light')
    setTheme('light')
  }, [])

  const setDarkTheme = useCallback(() => {
    localStorage.setItem('theme', 'dark')
    setTheme('dark')
  }, [])

  const value = useMemo(() => ({
    theme, toggleTheme, setLightTheme, setDarkTheme,
  }), [theme, toggleTheme, setLightTheme, setDarkTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
