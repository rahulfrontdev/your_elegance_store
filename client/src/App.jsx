import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import SplashScreen from './components/SplashScreen'
import './App.css'

/** Total time splash is visible before the app mounts */
const SPLASH_TOTAL_MS = 3000
/** Fade-out length at the end */
const SPLASH_FADE_MS = 500

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const [splashExiting, setSplashExiting] = useState(false)

  useEffect(() => {
    const fadeStart = Math.max(0, SPLASH_TOTAL_MS - SPLASH_FADE_MS)
    const fadeId = window.setTimeout(() => setSplashExiting(true), fadeStart)
    const doneId = window.setTimeout(() => setShowSplash(false), SPLASH_TOTAL_MS)
    return () => {
      window.clearTimeout(fadeId)
      window.clearTimeout(doneId)
    }
  }, [])

  return (
    <>
      <div className={`app-shell${showSplash ? '' : ' app-shell--ready'}`}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </div>

      {showSplash && <SplashScreen exiting={splashExiting} />}
    </>
  )
}

export default App
