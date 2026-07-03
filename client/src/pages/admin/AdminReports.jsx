import { useCallback, useState } from 'react'
import { adminFetchProducts } from '../../api/adminApi'
import { getAdminAllOrdersRequest } from '../../api/orderApi'
import { downloadCsv } from '../../utils/csvExport'

const apiErrorText = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback

async function fetchAllOrders() {
  const limit = 100
  let page = 1
  let totalPages = 1
  const all = []

  while (page <= totalPages && page <= 50) {
    const { data } = await getAdminAllOrdersRequest({ page, limit })
    const payload = data?.data ?? data
    const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
    all.push(...list)
    totalPages = Number(payload?.pages ?? payload?.totalPages ?? 1) || 1
    page += 1
  }

  return all
}

const AdminReports = () => {
  const [exporting, setExporting] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    if (text) window.setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const exportOrders = useCallback(async () => {
    setExporting('orders')
    try {
      const orders = await fetchAllOrders()
      const rows = [
        [
          'Order ID',
          'Date',
          'Customer',
          'Email',
          'Payment Status',
          'Order Status',
          'Total (INR)',
          'Items',
        ],
        ...orders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : []
          const itemSummary = items
            .map((line) => {
              const name = line?.name || line?.product?.name || 'Item'
              const qty = line?.quantity ?? line?.qty ?? 1
              return `${name} x${qty}`
            })
            .join('; ')
          return [
            order._id || order.id || '',
            order.createdAt || '',
            order.user?.name || order.shippingAddress?.fullName || '',
            order.user?.email || '',
            order.paymentStatus || '',
            order.orderStatus || order.status || '',
            order.totalPrice ?? order.total ?? '',
            itemSummary,
          ]
        }),
      ]
      downloadCsv(`orders-export-${new Date().toISOString().slice(0, 10)}.csv`, rows)
      showMessage('success', `Exported ${orders.length} order(s).`)
    } catch (err) {
      showMessage('error', apiErrorText(err, 'Failed to export orders.'))
    } finally {
      setExporting('')
    }
  }, [])

  const exportProducts = useCallback(async () => {
    setExporting('products')
    try {
      const res = await adminFetchProducts()
      const products = Array.isArray(res?.data) ? res.data : res?.data?.data || []
      const rows = [
        ['SKU', 'Name', 'Category', 'Price', 'Qty', 'GST %', 'Colour', 'Created'],
        ...products.map((p) => [
          p.sku || '',
          p.name || '',
          typeof p.category === 'object' ? p.category?.name || '' : p.category || '',
          p.price ?? '',
          p.qty ?? '',
          p.gstRate ?? '',
          p.colour || '',
          p.createdAt || '',
        ]),
      ]
      downloadCsv(`products-export-${new Date().toISOString().slice(0, 10)}.csv`, rows)
      showMessage('success', `Exported ${products.length} product(s).`)
    } catch (err) {
      showMessage('error', apiErrorText(err, 'Failed to export products.'))
    } finally {
      setExporting('')
    }
  }, [])

  const exportSalesSummary = useCallback(async () => {
    setExporting('sales')
    try {
      const orders = await fetchAllOrders()
      const now = new Date()
      const month = now.getMonth()
      const year = now.getFullYear()

      const monthOrders = orders.filter((order) => {
        if (!order.createdAt) return false
        const d = new Date(order.createdAt)
        return d.getMonth() === month && d.getFullYear() === year
      })

      const paid = monthOrders
        .filter((o) => String(o.paymentStatus || '').toLowerCase() === 'paid')
        .reduce((sum, o) => sum + Number(o.totalPrice ?? o.total ?? 0), 0)
      const gross = monthOrders.reduce((sum, o) => sum + Number(o.totalPrice ?? o.total ?? 0), 0)
      const pending = monthOrders
        .filter((o) => String(o.paymentStatus || '').toLowerCase() === 'pending')
        .reduce((sum, o) => sum + Number(o.totalPrice ?? o.total ?? 0), 0)

      const rows = [
        ['Metric', 'Value'],
        ['Month', now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })],
        ['Orders count', monthOrders.length],
        ['Total sales (paid INR)', paid],
        ['Gross order value (INR)', gross],
        ['Pending payment (INR)', pending],
      ]
      downloadCsv(`sales-summary-${new Date().toISOString().slice(0, 10)}.csv`, rows)
      showMessage('success', 'Sales summary exported.')
    } catch (err) {
      showMessage('error', apiErrorText(err, 'Failed to export sales summary.'))
    } finally {
      setExporting('')
    }
  }, [])

  const cards = [
    {
      id: 'orders',
      title: 'Orders report',
      description: 'Download all orders with customer, payment, and item details as CSV.',
      action: exportOrders,
    },
    {
      id: 'products',
      title: 'Products report',
      description: 'Download product catalogue with SKU, price, stock, and category.',
      action: exportProducts,
    },
    {
      id: 'sales',
      title: 'Sales summary',
      description: 'Download this month paid sales, gross value, and pending totals.',
      action: exportSalesSummary,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <p className="mt-1 text-sm text-gray-600">Export store data as CSV for accounting and analysis.</p>

      {message.text && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            message.type === 'error'
              ? 'border border-red-200 bg-red-50 text-red-800'
              : 'border border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">{card.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{card.description}</p>
            <button
              type="button"
              onClick={card.action}
              disabled={Boolean(exporting)}
              className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {exporting === card.id ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminReports
