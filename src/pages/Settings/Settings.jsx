import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  importFromJSON,
  generateHTMLReport,
  fetchAllUserData,
} from '../../services/export'
import { fetchWallets } from '../../services/wallets'
import { fetchCategories } from '../../services/categories'
import { fetchTransactions } from '../../services/transactions'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function Settings() {
  const { user } = useAuth()
  const { theme, setLightTheme, setDarkTheme } = useTheme()
  const fileInputRef = useRef(null)
  const [exporting, setExporting] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [importMode, setImportMode] = useState('replace')

  async function handleExportCSV() {
    setExporting('csv')
    try {
      const [{ data: transactions, count }, wallets, categories] = await Promise.all([
        fetchTransactions({ limit: 10000 }),
        fetchWallets(),
        fetchCategories(),
      ])
      exportToCSV(transactions, wallets, categories)
      if (count > 10000) {
        alert(`Se exportaron 10,000 de ${count.toLocaleString()} transacciones. Las mas antiguas fueron omitidas.`)
      }
    } catch (err) {
      console.error('Error exportando CSV:', err)
      alert('Error al exportar CSV')
    } finally {
      setExporting(null)
    }
  }

  async function handleExportExcel() {
    setExporting('excel')
    try {
      await exportToExcel()
    } catch (err) {
      console.error('Error exportando Excel:', err)
      alert('Error al exportar Excel')
    } finally {
      setExporting(null)
    }
  }

  async function handleExportJSON() {
    setExporting('json')
    try {
      await exportToJSON()
    } catch (err) {
      console.error('Error exportando JSON:', err)
      alert('Error al exportar backup')
    } finally {
      setExporting(null)
    }
  }

  async function handleExportPDF() {
    setExporting('pdf')
    try {
      await generateHTMLReport()
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar reporte PDF')
    } finally {
      setExporting(null)
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      alert('Por favor selecciona un archivo .json')
      return
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      alert('El archivo es demasiado grande. El tamaño máximo es 10 MB.')
      return
    }

    setPendingFile(file)
    setShowImportConfirm(true)
  }

  async function handleImportConfirm() {
    if (!pendingFile) return

    setShowImportConfirm(false)
    setImporting(true)
    setImportResult(null)

    try {
      const result = await importFromJSON(pendingFile, { merge: importMode === 'merge' })
      setImportResult(result)
    } catch (err) {
      console.error('Error importando:', err)
      setImportResult({ success: false, error: err.message })
    } finally {
      setImporting(false)
      setPendingFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configuracion</h1>

      {/* Cuenta */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cuenta</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Usuario activo</p>
          </div>
        </div>
      </div>

      {/* Tema */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Apariencia</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Selecciona el tema de la aplicacion.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={setLightTheme}
            className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === 'light' ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <svg className={`w-5 h-5 ${theme === 'light' ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className={`font-medium ${theme === 'light' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                Claro
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tema claro</p>
            </div>
          </button>

          <button
            onClick={setDarkTheme}
            className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </div>
            <div className="text-left">
              <p className={`font-medium ${theme === 'dark' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                Oscuro
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tema oscuro</p>
            </div>
          </button>
        </div>
      </div>

      {/* Exportacion */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exportar Datos</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Descarga tus datos en diferentes formatos para backup o analisis externo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {exporting === 'csv' ? 'Exportando...' : 'Exportar CSV'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Transacciones en formato CSV</p>
            </div>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {exporting === 'excel' ? 'Exportando...' : 'Exportar Excel'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Todos los datos en .xlsx</p>
            </div>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {exporting === 'pdf' ? 'Generando...' : 'Reporte PDF'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Resumen del mes actual</p>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={exporting}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {exporting === 'json' ? 'Exportando...' : 'Backup JSON'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Backup completo restaurable</p>
            </div>
          </button>
        </div>
      </div>

      {/* Importacion */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Importar Datos</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Restaura un backup anterior o migra datos desde otra instalacion.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="importMode"
              value="replace"
              checked={importMode === 'replace'}
              onChange={(e) => setImportMode(e.target.value)}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Reemplazar datos existentes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="importMode"
              value="merge"
              checked={importMode === 'merge'}
              onChange={(e) => setImportMode(e.target.value)}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Combinar con existentes</span>
          </label>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors w-full disabled:opacity-50"
        >
          {importing ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-300">Importando...</span>
            </div>
          ) : (
            <>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-gray-600 dark:text-gray-300">Seleccionar archivo JSON de backup</span>
            </>
          )}
        </button>

        {importResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              importResult.success
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            }`}
          >
            {importResult.success ? (
              <div>
                <p className="font-medium text-green-700 dark:text-green-300 mb-2">Importacion exitosa</p>
                <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                  <li>Billeteras: {importResult.imported.wallets}</li>
                  <li>Categorias: {importResult.imported.categories}</li>
                  <li>Transacciones: {importResult.imported.transactions}</li>
                  <li>Presupuestos: {importResult.imported.budgets}</li>
                  <li>Recurrentes: {importResult.imported.recurring}</li>
                </ul>
                <p className="text-xs text-green-500 dark:text-green-500 mt-2">Recarga la pagina para ver los cambios.</p>
              </div>
            ) : (
              <p className="text-red-700 dark:text-red-300">{importResult.error || 'Error al importar'}</p>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Acerca de</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Finance App v1.0 - Aplicacion de finanzas personales
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Desarrollada con React + Supabase
        </p>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showImportConfirm}
        onClose={() => {
          setShowImportConfirm(false)
          setPendingFile(null)
        }}
        onConfirm={handleImportConfirm}
        title="Confirmar Importacion"
        message={
          importMode === 'replace'
            ? 'Esto eliminara todos tus datos actuales y los reemplazara con el backup. Esta accion no se puede deshacer. ¿Continuar?'
            : 'Esto agregara los datos del backup a tus datos existentes. Puede crear duplicados. ¿Continuar?'
        }
        confirmText="Importar"
      />
    </div>
  )
}
