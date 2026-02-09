import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// =============================================
// FETCH ALL DATA
// =============================================

export async function fetchAllUserData() {
  const [wallets, categories, transactions, budgets, recurring, rates] = await Promise.all([
    supabase.from('wallets').select('*').then(r => r.data || []),
    supabase.from('categories').select('*').then(r => r.data || []),
    supabase.from('transactions').select('*').order('date', { ascending: false }).then(r => r.data || []),
    supabase.from('budgets').select('*').then(r => r.data || []),
    supabase.from('recurring_transactions').select('*').then(r => r.data || []),
    supabase.from('exchange_rates').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
  ])

  return { wallets, categories, transactions, budgets, recurring, rates }
}

// =============================================
// EXPORT CSV
// =============================================

export function exportToCSV(transactions, wallets, categories) {
  // Crear mapas para lookup
  const walletMap = Object.fromEntries(wallets.map(w => [w.id, w]))
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  // Preparar datos
  const rows = transactions.map(tx => ({
    Fecha: new Date(tx.date).toLocaleDateString('es-VE'),
    Tipo: tx.type === 'income' ? 'Ingreso' : tx.type === 'expense' ? 'Gasto' : tx.type === 'transfer_in' ? 'Transferencia (entrada)' : 'Transferencia (salida)',
    Categoria: categoryMap[tx.category_id]?.name || '-',
    Billetera: walletMap[tx.wallet_id]?.name || '-',
    Monto: tx.amount,
    Moneda: tx.currency,
    Descripcion: tx.description || '',
    'Tasa de Cambio': tx.exchange_rate || '',
  }))

  // Crear CSV
  const headers = Object.keys(rows[0] || {})
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        let val = String(row[h] ?? '')
        // Proteger contra inyección de fórmulas (CSV Injection)
        if (/^[=+\-@\t\r]/.test(val)) {
          val = "'" + val
        }
        // Escapar comas y comillas
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }).join(',')
    )
  ].join('\n')

  // Descargar
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const filename = `transacciones_${new Date().toISOString().split('T')[0]}.csv`
  saveAs(blob, filename)

  return filename
}

// =============================================
// EXPORT EXCEL
// =============================================

export async function exportToExcel() {
  const { wallets, categories, transactions, budgets, recurring, rates } = await fetchAllUserData()

  // Crear mapas para lookup
  const walletMap = Object.fromEntries(wallets.map(w => [w.id, w]))
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  // Sheet: Transacciones
  const txData = transactions.map(tx => ({
    Fecha: new Date(tx.date).toLocaleDateString('es-VE'),
    Tipo: tx.type === 'income' ? 'Ingreso' : tx.type === 'expense' ? 'Gasto' : tx.type === 'transfer_in' ? 'Transferencia (entrada)' : 'Transferencia (salida)',
    Categoria: categoryMap[tx.category_id]?.name || '-',
    Billetera: walletMap[tx.wallet_id]?.name || '-',
    Monto: parseFloat(tx.amount),
    Moneda: tx.currency,
    Descripcion: tx.description || '',
    'Tasa de Cambio': tx.exchange_rate ? parseFloat(tx.exchange_rate) : '',
  }))

  // Sheet: Billeteras
  const walletData = wallets.map(w => ({
    Nombre: w.name,
    Moneda: w.currency,
    'Incluir en Total': w.include_in_total ? 'Si' : 'No',
    'Fecha Creacion': new Date(w.created_at).toLocaleDateString('es-VE'),
  }))

  // Sheet: Categorias
  const categoryData = categories.map(c => ({
    Nombre: c.name,
    Tipo: c.type === 'income' ? 'Ingreso' : 'Gasto',
    Color: c.color,
    'Fecha Creacion': new Date(c.created_at).toLocaleDateString('es-VE'),
  }))

  // Sheet: Presupuestos
  const budgetData = budgets.map(b => ({
    Categoria: categoryMap[b.category_id]?.name || '-',
    'Limite (USD)': parseFloat(b.amount),
    Periodo: b.period === 'weekly' ? 'Semanal' : b.period === 'monthly' ? 'Mensual' : 'Anual',
    'Fecha Inicio': b.start_date,
    Activo: b.is_active ? 'Si' : 'No',
  }))

  // Sheet: Recurrentes
  const recurringData = recurring.map(r => ({
    Descripcion: r.description || categoryMap[r.category_id]?.name || '-',
    Tipo: r.type === 'income' ? 'Ingreso' : 'Gasto',
    Billetera: walletMap[r.wallet_id]?.name || '-',
    Monto: parseFloat(r.amount),
    Frecuencia: r.frequency,
    'Fecha Inicio': r.start_date,
    'Fecha Fin': r.end_date || '-',
    Activo: r.is_active ? 'Si' : 'No',
  }))

  // Crear workbook
  const wb = XLSX.utils.book_new()

  if (txData.length > 0) {
    const wsTransactions = XLSX.utils.json_to_sheet(txData)
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transacciones')
  }

  if (walletData.length > 0) {
    const wsWallets = XLSX.utils.json_to_sheet(walletData)
    XLSX.utils.book_append_sheet(wb, wsWallets, 'Billeteras')
  }

  if (categoryData.length > 0) {
    const wsCategories = XLSX.utils.json_to_sheet(categoryData)
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Categorias')
  }

  if (budgetData.length > 0) {
    const wsBudgets = XLSX.utils.json_to_sheet(budgetData)
    XLSX.utils.book_append_sheet(wb, wsBudgets, 'Presupuestos')
  }

  if (recurringData.length > 0) {
    const wsRecurring = XLSX.utils.json_to_sheet(recurringData)
    XLSX.utils.book_append_sheet(wb, wsRecurring, 'Recurrentes')
  }

  // Descargar
  const filename = `finance_app_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)

  return filename
}

// =============================================
// EXPORT JSON (Backup completo)
// =============================================

export async function exportToJSON() {
  const data = await fetchAllUserData()

  // Agregar metadata
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data,
  }

  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const filename = `finance_app_backup_${new Date().toISOString().split('T')[0]}.json`
  saveAs(blob, filename)

  return filename
}

// =============================================
// IMPORT JSON
// =============================================

const VALID_CURRENCIES = ['VES', 'USDT', 'USD']
const VALID_TX_TYPES = ['income', 'expense', 'transfer_in', 'transfer_out']
const VALID_CAT_TYPES = ['income', 'expense']
const VALID_PERIODS = ['weekly', 'monthly', 'yearly']
const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly']
const MAX_STRING_LENGTH = 500
const MAX_AMOUNT = 999999999999

function validateImportData(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return ['Formato de archivo invalido: falta el objeto data']
  }

  const { wallets, categories, transactions, budgets, recurring } = data

  // Validar que sean arrays (si existen)
  if (wallets !== undefined && !Array.isArray(wallets)) errors.push('wallets debe ser un array')
  if (categories !== undefined && !Array.isArray(categories)) errors.push('categories debe ser un array')
  if (transactions !== undefined && !Array.isArray(transactions)) errors.push('transactions debe ser un array')
  if (budgets !== undefined && !Array.isArray(budgets)) errors.push('budgets debe ser un array')
  if (recurring !== undefined && !Array.isArray(recurring)) errors.push('recurring debe ser un array')

  if (errors.length > 0) return errors

  // Validar wallets
  if (wallets) {
    for (let i = 0; i < wallets.length; i++) {
      const w = wallets[i]
      if (!w.name || typeof w.name !== 'string') errors.push(`wallets[${i}]: name invalido`)
      if (w.name && w.name.length > MAX_STRING_LENGTH) errors.push(`wallets[${i}]: name demasiado largo`)
      if (!VALID_CURRENCIES.includes(w.currency)) errors.push(`wallets[${i}]: currency invalida '${w.currency}'`)
    }
  }

  // Validar categories
  if (categories) {
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i]
      if (!c.name || typeof c.name !== 'string') errors.push(`categories[${i}]: name invalido`)
      if (c.name && c.name.length > MAX_STRING_LENGTH) errors.push(`categories[${i}]: name demasiado largo`)
      if (!VALID_CAT_TYPES.includes(c.type)) errors.push(`categories[${i}]: type invalido '${c.type}'`)
    }
  }

  // Validar transactions
  if (transactions) {
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      const amount = parseFloat(tx.amount)
      if (isNaN(amount) || amount < 0 || amount > MAX_AMOUNT) errors.push(`transactions[${i}]: amount invalido`)
      if (!VALID_TX_TYPES.includes(tx.type)) errors.push(`transactions[${i}]: type invalido '${tx.type}'`)
      if (tx.currency && !VALID_CURRENCIES.includes(tx.currency)) errors.push(`transactions[${i}]: currency invalida`)
      if (tx.description && typeof tx.description === 'string' && tx.description.length > MAX_STRING_LENGTH) errors.push(`transactions[${i}]: description demasiado larga`)
      if (errors.length > 10) { errors.push('...demasiados errores, abortando validación'); break }
    }
  }

  // Validar budgets
  if (budgets) {
    for (let i = 0; i < budgets.length; i++) {
      const b = budgets[i]
      const amount = parseFloat(b.amount)
      if (isNaN(amount) || amount <= 0 || amount > MAX_AMOUNT) errors.push(`budgets[${i}]: amount invalido`)
      if (!VALID_PERIODS.includes(b.period)) errors.push(`budgets[${i}]: period invalido '${b.period}'`)
    }
  }

  // Validar recurring
  if (recurring) {
    for (let i = 0; i < recurring.length; i++) {
      const r = recurring[i]
      const amount = parseFloat(r.amount)
      if (isNaN(amount) || amount <= 0 || amount > MAX_AMOUNT) errors.push(`recurring[${i}]: amount invalido`)
      if (!VALID_TX_TYPES.includes(r.type)) errors.push(`recurring[${i}]: type invalido`)
      if (!VALID_FREQUENCIES.includes(r.frequency)) errors.push(`recurring[${i}]: frequency invalida '${r.frequency}'`)
    }
  }

  return errors
}

export async function importFromJSON(file, options = { merge: false }) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const content = e.target.result
        const backup = JSON.parse(content)

        // Validar estructura básica
        if (!backup.data) {
          throw new Error('Formato de archivo invalido')
        }

        // Validar esquema y datos
        const validationErrors = validateImportData(backup.data)
        if (validationErrors.length > 0) {
          throw new Error('Datos invalidos en el archivo:\n' + validationErrors.slice(0, 5).join('\n'))
        }

        const { wallets, categories, transactions, budgets, recurring } = backup.data
        const user = await getAuthenticatedUser()

        // Si no es merge, eliminar datos existentes
        if (!options.merge) {
          await supabase.from('transactions').delete().eq('user_id', user.id)
          await supabase.from('budgets').delete().eq('user_id', user.id)
          await supabase.from('recurring_transactions').delete().eq('user_id', user.id)
          await supabase.from('wallets').delete().eq('user_id', user.id)
          await supabase.from('categories').delete().eq('user_id', user.id)
        }

        // Mapas para IDs nuevos
        const walletIdMap = {}
        const categoryIdMap = {}

        // Importar categorias
        if (categories && categories.length > 0) {
          for (const cat of categories) {
            const oldId = cat.id
            const { data: newCat } = await supabase
              .from('categories')
              .insert({
                user_id: user.id,
                name: cat.name,
                type: cat.type,
                color: cat.color,
                icon: cat.icon,
              })
              .select()
              .single()

            if (newCat) {
              categoryIdMap[oldId] = newCat.id
            }
          }
        }

        // Importar billeteras
        if (wallets && wallets.length > 0) {
          for (const wallet of wallets) {
            const oldId = wallet.id
            const { data: newWallet } = await supabase
              .from('wallets')
              .insert({
                user_id: user.id,
                name: wallet.name,
                currency: wallet.currency,
                include_in_total: wallet.include_in_total,
              })
              .select()
              .single()

            if (newWallet) {
              walletIdMap[oldId] = newWallet.id
            }
          }
        }

        // Importar transacciones (incluye amount_usd)
        const txIdMap = {}
        if (transactions && transactions.length > 0) {
          // Primero insertar transacciones sin linked_transaction_id
          for (const tx of transactions) {
            if (!walletIdMap[tx.wallet_id]) continue

            const { data: newTx } = await supabase
              .from('transactions')
              .insert({
                user_id: user.id,
                wallet_id: walletIdMap[tx.wallet_id],
                category_id: tx.category_id ? categoryIdMap[tx.category_id] : null,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency,
                exchange_rate: tx.exchange_rate,
                amount_usd: tx.amount_usd || null,
                conversion_rate: tx.conversion_rate || null,
                description: tx.description,
                date: tx.date,
              })
              .select('id')
              .single()

            if (newTx) {
              txIdMap[tx.id] = newTx.id
            }
          }

          // Re-vincular transferencias usando el mapa de IDs
          for (const tx of transactions) {
            if (tx.linked_transaction_id && txIdMap[tx.id] && txIdMap[tx.linked_transaction_id]) {
              await supabase
                .from('transactions')
                .update({ linked_transaction_id: txIdMap[tx.linked_transaction_id] })
                .eq('id', txIdMap[tx.id])
            }
          }
        }

        // Importar presupuestos
        if (budgets && budgets.length > 0) {
          const budgetsToInsert = budgets
            .filter(b => categoryIdMap[b.category_id])
            .map(b => ({
              user_id: user.id,
              category_id: categoryIdMap[b.category_id],
              amount: b.amount,
              period: b.period,
              start_date: b.start_date,
              is_active: b.is_active,
            }))

          if (budgetsToInsert.length > 0) {
            await supabase.from('budgets').insert(budgetsToInsert)
          }
        }

        // Importar recurrentes
        if (recurring && recurring.length > 0) {
          const recurringToInsert = recurring
            .filter(r => walletIdMap[r.wallet_id] && categoryIdMap[r.category_id])
            .map(r => ({
              user_id: user.id,
              wallet_id: walletIdMap[r.wallet_id],
              category_id: categoryIdMap[r.category_id],
              type: r.type,
              amount: r.amount,
              frequency: r.frequency,
              start_date: r.start_date,
              end_date: r.end_date,
              is_active: r.is_active,
              description: r.description,
            }))

          if (recurringToInsert.length > 0) {
            await supabase.from('recurring_transactions').insert(recurringToInsert)
          }
        }

        resolve({
          success: true,
          imported: {
            wallets: Object.keys(walletIdMap).length,
            categories: Object.keys(categoryIdMap).length,
            transactions: transactions?.length || 0,
            budgets: budgets?.length || 0,
            recurring: recurring?.length || 0,
          },
        })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(new Error('Error leyendo archivo'))
    reader.readAsText(file)
  })
}

// =============================================
// GENERATE HTML REPORT (abre en nueva pestaña para imprimir como PDF)
// =============================================

export async function generateHTMLReport() {
  const { wallets, categories, transactions } = await fetchAllUserData()

  // Crear mapas
  const walletMap = Object.fromEntries(wallets.map(w => [w.id, w]))
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  // Calcular estadisticas
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const thisMonthTx = transactions.filter(tx => new Date(tx.date) >= startOfMonth)

  let totalIncome = 0
  let totalExpense = 0
  const expenseByCategory = {}

  for (const tx of thisMonthTx) {
    if (tx.type === 'income') {
      totalIncome += parseFloat(tx.amount)
    } else if (tx.type === 'expense') {
      totalExpense += parseFloat(tx.amount)
      const catName = categoryMap[tx.category_id]?.name || 'Sin categoria'
      expenseByCategory[catName] = (expenseByCategory[catName] || 0) + parseFloat(tx.amount)
    }
  }

  // Generar HTML para el reporte
  const monthName = now.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reporte Financiero - ${escapeHTML(monthName)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #f3f4f6; padding: 20px; border-radius: 8px; flex: 1; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .stat-value.income { color: #22c55e; }
        .stat-value.expense { color: #ef4444; }
        .stat-value.balance { color: #4f46e5; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Reporte Financiero</h1>
      <p>Periodo: ${escapeHTML(monthName)}</p>
      <p>Generado: ${now.toLocaleString('es-VE')}</p>

      <h2>Resumen</h2>
      <div class="stats">
        <div class="stat-card">
          <div>Ingresos</div>
          <div class="stat-value income">+${totalIncome.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
          <div>Gastos</div>
          <div class="stat-value expense">-${totalExpense.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
          <div>Balance</div>
          <div class="stat-value balance">${(totalIncome - totalExpense).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <h2>Gastos por Categoria</h2>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Monto</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => `
              <tr>
                <td>${escapeHTML(cat)}</td>
                <td>${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                <td>${totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0}%</td>
              </tr>
            `).join('')}
        </tbody>
      </table>

      <h2>Billeteras</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Moneda</th>
          </tr>
        </thead>
        <tbody>
          ${wallets.map(w => `
            <tr>
              <td>${escapeHTML(w.name)}</td>
              <td>${escapeHTML(w.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Finance App - Reporte generado automaticamente</p>
      </div>
    </body>
    </html>
  `

  // Abrir en nueva ventana para imprimir/guardar como PDF
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana del reporte. Desactiva el bloqueador de popups e intenta de nuevo.')
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.print()
}
