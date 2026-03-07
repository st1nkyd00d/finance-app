import { useState, useEffect, useCallback } from 'react'
import { HiPlus, HiTag, HiMagnifyingGlass, HiArrowDownTray, HiTrash } from 'react-icons/hi2'
import ProductCard from './ProductCard'
import ProductForm from './ProductForm'
import PriceForm from './PriceForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductPrice,
  updateProductPrice,
  deleteProductPrice,
  seedDefaultProducts,
  deleteAllProducts,
} from '../../services/products'

export default function ProductCatalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const { success, error: toastError } = useToast()

  // Product form
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  // Price form
  const [priceFormOpen, setPriceFormOpen] = useState(false)
  const [priceContext, setPriceContext] = useState({ product: null, price: null })

  // Delete confirms
  const [deleteProduct_, setDeleteProduct_] = useState({ isOpen: false, id: null, name: '' })
  const [deletePrice_, setDeletePrice_] = useState({ isOpen: false, id: null, productName: '', storeName: '' })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Seed confirm
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)

  // Delete all confirm
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Search includes name and brand
  const filtered = products.filter((p) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    )
  })

  // Product CRUD
  const openCreateProduct = () => { setEditingProduct(null); setProductFormOpen(true) }
  const openEditProduct = (p) => { setEditingProduct(p); setProductFormOpen(true) }
  // Duplicar: copia nombre y unidad, limpia marca para que el usuario elija otra
  const openDuplicateProduct = (p) => {
    setEditingProduct({ name: p.name, unit: p.unit, notes: p.notes, brand: '' })
    setProductFormOpen(true)
  }
  const closeProductForm = () => { setProductFormOpen(false); setEditingProduct(null) }

  const handleSaveProduct = async (data) => {
    try {
      if (editingProduct?.id) {
        await updateProduct(editingProduct.id, data)
        success('Producto actualizado')
      } else {
        await createProduct(data)
        success('Producto creado')
      }
      await loadProducts()
    } catch (err) {
      toastError(err.message || 'Error al guardar')
      throw err
    }
  }

  const openDeleteProduct = (p) => setDeleteProduct_({ isOpen: true, id: p.id, name: p.name })
  const closeDeleteProduct = () => setDeleteProduct_({ isOpen: false, id: null, name: '' })

  const handleDeleteProduct = async () => {
    setDeleteLoading(true)
    try {
      await deleteProduct(deleteProduct_.id)
      success('Producto eliminado')
      closeDeleteProduct()
      await loadProducts()
    } catch (err) {
      toastError(err.message || 'Error al eliminar')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Price CRUD
  const openAddPrice = (product) => { setPriceContext({ product, price: null }); setPriceFormOpen(true) }
  const openEditPrice = (product, price) => { setPriceContext({ product, price }); setPriceFormOpen(true) }
  const closePriceForm = () => { setPriceFormOpen(false); setPriceContext({ product: null, price: null }) }

  const handleSavePrice = async (data) => {
    try {
      if (priceContext.price) {
        await updateProductPrice(priceContext.price.id, data)
        success('Precio actualizado')
      } else {
        await createProductPrice({ ...data, product_id: priceContext.product.id })
        success('Precio agregado')
      }
      await loadProducts()
    } catch (err) {
      toastError(err.message || 'Error al guardar precio')
      throw err
    }
  }

  const openDeletePrice = (product, price) => {
    setDeletePrice_({ isOpen: true, id: price.id, productName: product.name, storeName: price.store_name })
  }
  const closeDeletePrice = () => setDeletePrice_({ isOpen: false, id: null, productName: '', storeName: '' })

  const handleDeletePrice = async () => {
    setDeleteLoading(true)
    try {
      await deleteProductPrice(deletePrice_.id)
      success('Precio eliminado')
      closeDeletePrice()
      await loadProducts()
    } catch (err) {
      toastError(err.message || 'Error al eliminar')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Delete all
  const handleDeleteAll = async () => {
    setDeleteAllLoading(true)
    try {
      await deleteAllProducts()
      success('Todos los productos eliminados')
      setDeleteAllConfirmOpen(false)
      await loadProducts()
    } catch (err) {
      toastError(err.message || 'Error al eliminar')
    } finally {
      setDeleteAllLoading(false)
    }
  }

  // Seed
  const handleSeed = async () => {
    setSeedLoading(true)
    try {
      const added = await seedDefaultProducts()
      if (added.length === 0) {
        success('Todos los productos base ya están en tu catálogo')
      } else {
        success(`${added.length} producto${added.length !== 1 ? 's' : ''} base agregado${added.length !== 1 ? 's' : ''}`)
      }
      setSeedConfirmOpen(false)
      await loadProducts()
    } catch (err) {
      toastError(err.message || 'Error al cargar productos base')
    } finally {
      setSeedLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o marca..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <button
          onClick={() => setSeedConfirmOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors shrink-0"
          title="Cargar productos base (harina, pollo, arroz...)"
        >
          <HiArrowDownTray className="w-4 h-4" />
          Restaurar base
        </button>
        {products.length > 0 && (
          <button
            onClick={() => setDeleteAllConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors shrink-0"
            title="Eliminar todos los productos"
          >
            <HiTrash className="w-4 h-4" />
            Borrar todo
          </button>
        )}
        <button
          onClick={openCreateProduct}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shrink-0"
        >
          <HiPlus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <HiTag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            {search ? 'Sin resultados' : 'Catálogo vacío'}
          </p>
          {!search && (
            <>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
                Agrega tus productos o carga la lista base de productos comunes
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSeedConfirmOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  <HiArrowDownTray className="w-4 h-4" />
                  Cargar productos base
                </button>
                <button
                  onClick={openCreateProduct}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Crear producto
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openEditProduct}
              onDelete={openDeleteProduct}
              onDuplicate={openDuplicateProduct}
              onAddPrice={openAddPrice}
              onEditPrice={openEditPrice}
              onDeletePrice={openDeletePrice}
            />
          ))}
        </div>
      )}

      <ProductForm
        isOpen={productFormOpen}
        onClose={closeProductForm}
        onSave={handleSaveProduct}
        initialData={editingProduct}
      />

      <PriceForm
        isOpen={priceFormOpen}
        onClose={closePriceForm}
        onSave={handleSavePrice}
        initialData={priceContext.price}
        productName={priceContext.product?.name}
      />

      <ConfirmDialog
        isOpen={deleteProduct_.isOpen}
        onClose={closeDeleteProduct}
        onConfirm={handleDeleteProduct}
        title="Eliminar Producto"
        message={`¿Eliminar "${deleteProduct_.name}" y todos sus precios?`}
        confirmText="Eliminar"
        loading={deleteLoading}
      />

      <ConfirmDialog
        isOpen={deletePrice_.isOpen}
        onClose={closeDeletePrice}
        onConfirm={handleDeletePrice}
        title="Eliminar Precio"
        message={`¿Eliminar el precio de "${deletePrice_.productName}" en ${deletePrice_.storeName}?`}
        confirmText="Eliminar"
        loading={deleteLoading}
      />

      <ConfirmDialog
        isOpen={seedConfirmOpen}
        onClose={() => setSeedConfirmOpen(false)}
        onConfirm={handleSeed}
        title="Cargar productos base"
        message="Se agregarán los productos base que aún no tengas (harina, pollo, arroz, etc.) sin marca ni precios. Los que ya existen no se duplican."
        confirmText="Cargar"
        loading={seedLoading}
      />

      <ConfirmDialog
        isOpen={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
        onConfirm={handleDeleteAll}
        title="Eliminar todos los productos"
        message={`¿Eliminar los ${products.length} productos del catálogo junto con todos sus precios? Esta acción no se puede deshacer.`}
        confirmText="Eliminar todo"
        loading={deleteAllLoading}
      />
    </div>
  )
}
