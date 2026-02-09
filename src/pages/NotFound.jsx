import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</p>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Pagina no encontrada
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        La pagina que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
