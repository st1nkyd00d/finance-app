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
import { HiSun, HiMoon, HiTableCells, HiDocumentText, HiCircleStack, HiArrowUpTray } from 'react-icons/hi2'

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
      <h1 className="mb-6 font-bold text-2xl text-gray-900 dark:text-white">Configuración</h1>

      {/* Cuenta */}
      <div className="bg-white dark:bg-gray-800 shadow-sm mb-6 p-6 rounded-xl">
        <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">Cuenta</h2>
        <div className="flex items-center gap-4">
          <div className="flex justify-center items-center bg-indigo-100 dark:bg-indigo-900/50 rounded-full w-12 h-12">
            <span className="font-semibold text-indigo-600 text-lg dark:text-indigo-400">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
            <p className="text-gray-500 text-sm dark:text-gray-400">Usuario activo</p>
          </div>
        </div>
      </div>

      {/* Tema */}
      <div className="bg-white dark:bg-gray-800 shadow-sm mb-6 p-6 rounded-xl">
        <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">Apariencia</h2>
        <p className="mb-4 text-gray-500 text-sm dark:text-gray-400">
          Selecciona el tema de la aplicacion.
        </p>
        <div className="gap-3 grid grid-cols-2">
          <button
            onClick={setLightTheme}
            className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${theme === 'light'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
              <HiSun className={`w-5 h-5 ${theme === 'light' ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'}`} />
            </div>
            <div className="text-left">
              <p className={`font-medium ${theme === 'light' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                Claro
              </p>
              <p className="text-gray-500 text-xs dark:text-gray-400">Tema claro</p>
            </div>
          </button>

          <button
            onClick={setDarkTheme}
            className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${theme === 'dark'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
              <HiMoon className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} />
            </div>
            <div className="text-left">
              <p className={`font-medium ${theme === 'dark' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                Oscuro
              </p>
              <p className="text-gray-500 text-xs dark:text-gray-400">Tema oscuro</p>
            </div>
          </button>
        </div>
      </div>

      {/* Exportacion */}
      <div className="bg-white dark:bg-gray-800 shadow-sm mb-6 p-6 rounded-xl">
        <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">Exportar Datos</h2>
        <p className="mb-4 text-gray-500 text-sm dark:text-gray-400">
          Descarga tus datos en diferentes formatos para backup o análisis externo.
        </p>

        <div className="gap-3 grid grid-cols-1 md:grid-cols-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <div className="flex justify-center items-center bg-green-100 dark:bg-green-900/50 rounded-lg w-10 h-10">
              <HiTableCells className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {exporting === 'csv' ? 'Exportando...' : 'Exportar CSV'}
              </p>
              <p className="text-gray-500 text-xs dark:text-gray-400">Transacciones en formato CSV</p>
            </div>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <div className="flex justify-center items-center bg-emerald-100 dark:bg-emerald-900/50 rounded-lg w-10 h-10">
              <HiDocumentText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {exporting === 'excel' ? 'Exportando...' : 'Exportar Excel'}
              </p>
              <p className="text-gray-500 text-xs dark:text-gray-400">Todos los datos en .xlsx</p>
            </div>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <div className="flex justify-center items-center bg-red-100 dark:bg-red-900/50 rounded-lg w-10 h-10">
              <HiDocumentText className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {exporting === 'pdf' ? 'Generando...' : 'Reporte PDF'}
              </p>
              <p className="text-gray-500 text-xs dark:text-gray-400">Resumen del mes actual</p>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={exporting}
            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <div className="flex justify-center items-center bg-indigo-100 dark:bg-indigo-900/50 rounded-lg w-10 h-10">
              <HiCircleStack className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {exporting === 'json' ? 'Exportando...' : 'Backup JSON'}
              </p>
              <p className="text-gray-500 text-xs dark:text-gray-400">Backup completo restaurable</p>
            </div>
          </button>
        </div>
      </div>

      {/* Importacion */}
      <div className="bg-white dark:bg-gray-800 shadow-sm mb-6 p-6 rounded-xl">
        <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">Importar Datos</h2>
        <p className="mb-4 text-gray-500 text-sm dark:text-gray-400">
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
              className="focus:ring-indigo-500 text-indigo-600"
            />
            <span className="text-gray-700 text-sm dark:text-gray-300">Reemplazar datos existentes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="importMode"
              value="merge"
              checked={importMode === 'merge'}
              onChange={(e) => setImportMode(e.target.value)}
              className="focus:ring-indigo-500 text-indigo-600"
            />
            <span className="text-gray-700 text-sm dark:text-gray-300">Combinar con existentes</span>
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
          className="flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 p-4 border-2 border-gray-300 hover:border-indigo-400 dark:border-gray-600 dark:hover:border-indigo-500 border-dashed rounded-lg w-full transition-colors"
        >
          {importing ? (
            <div className="flex items-center gap-3">
              <div className="border-2 border-indigo-600 border-t-transparent rounded-full w-5 h-5 animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-300">Importando...</span>
            </div>
          ) : (
            <>
              <HiArrowUpTray className="w-6 h-6 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">Seleccionar archivo JSON de backup</span>
            </>
          )}
        </button>

        {importResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${importResult.success
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
              }`}
          >
            {importResult.success ? (
              <div>
                <p className="mb-2 font-medium text-green-700 dark:text-green-300">Importacion exitosa</p>
                <ul className="space-y-1 text-green-600 text-sm dark:text-green-400">
                  <li>Billeteras: {importResult.imported.wallets}</li>
                  <li>Categorías: {importResult.imported.categories}</li>
                  <li>Transacciones: {importResult.imported.transactions}</li>
                  <li>Presupuestos: {importResult.imported.budgets}</li>
                  <li>Recurrentes: {importResult.imported.recurring}</li>
                </ul>
                <p className="mt-2 text-green-500 text-xs dark:text-green-500">Recarga la pagina para ver los cambios.</p>
              </div>
            ) : (
              <p className="text-red-700 dark:text-red-300">{importResult.error || 'Error al importar'}</p>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
        <h2 className="mb-2 font-semibold text-gray-900 text-lg dark:text-white">Acerca de</h2>
        <p className="text-gray-500 text-sm dark:text-gray-400">
          Finance App v1.0 - Aplicacion de finanzas personales
        </p>
        <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
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
