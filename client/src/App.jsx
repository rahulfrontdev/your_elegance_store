import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import PageMeta from './components/PageMeta'
import SplashScreen from './components/SplashScreen'
import './App.css'

/** How long the splash stays fully visible (matches one logo spin) */
const SPLASH_VISIBLE_MS = 2100
/** Fade-out — store fades in at the same time */
const SPLASH_FADE_MS = 350

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const [splashExiting, setSplashExiting] = useState(false)

  useEffect(() => {
    const fadeId = window.setTimeout(() => setSplashExiting(true), SPLASH_VISIBLE_MS)
    const doneId = window.setTimeout(
      () => setShowSplash(false),
      SPLASH_VISIBLE_MS + SPLASH_FADE_MS
    )
    return () => {
      window.clearTimeout(fadeId)
      window.clearTimeout(doneId)
    }
  }, [])

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
      <div className={`app-shell${showSplash && !splashExiting ? '' : ' app-shell--ready'}`}>
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
