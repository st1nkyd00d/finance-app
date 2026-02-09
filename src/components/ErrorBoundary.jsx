import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center px-4">
          <p className="text-5xl mb-4">:(</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Algo salio mal
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Ocurrio un error inesperado. Intenta recargar la pagina.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Recargar pagina
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
