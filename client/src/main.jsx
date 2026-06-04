import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import { SITE_DESCRIPTION, SITE_TITLE } from './config/siteMeta'

document.title = SITE_TITLE

let descriptionMeta = document.querySelector('meta[name="description"]')
if (!descriptionMeta) {
  descriptionMeta = document.createElement('meta')
  descriptionMeta.setAttribute('name', 'description')
  document.head.appendChild(descriptionMeta)
}
descriptionMeta.setAttribute('content', SITE_DESCRIPTION)
import { store } from './app/store.js'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </Provider>
  </StrictMode>
)
