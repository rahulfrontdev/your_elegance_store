import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import PageMeta from './components/PageMeta'
import SplashScreen from './components/SplashScreen'
import './App.css'

/** How long the splash stays fully visible (matches one logo spin) */
const SPLASH_VISIBLE_MS = 850
/** Fade-out — store fades in at the same time */
const SPLASH_FADE_MS = 280
const SPLASH_SESSION_KEY = 'yes_store_splash_seen'

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem(SPLASH_SESSION_KEY)
    } catch {
      return true
    }
  })
  const [splashExiting, setSplashExiting] = useState(false)

  useEffect(() => {
    if (!showSplash) return undefined

    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1')
    } catch {
      /* ignore */
    }

    const fadeId = window.setTimeout(() => setSplashExiting(true), SPLASH_VISIBLE_MS)
    const doneId = window.setTimeout(
      () => setShowSplash(false),
      SPLASH_VISIBLE_MS + SPLASH_FADE_MS
    )
    return () => {
      window.clearTimeout(fadeId)
      window.clearTimeout(doneId)
    }
  }, [showSplash])

  /* Lock page while splash shows — stops mobile scroll / bar resize shifting the logo */
  useEffect(() => {
    if (!showSplash) return
    const prevOverflow = document.body.style.overflow
    const prevPosition = document.body.style.position
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.width = ''
    }
  }, [showSplash])

  return (
    <>
      <div className="app-shell app-shell--ready">
        <BrowserRouter>
          <PageMeta />
          <AppRoutes />
        </BrowserRouter>
      </div>

      {showSplash && <SplashScreen exiting={splashExiting} />}
    </>
  )
}

export default App
