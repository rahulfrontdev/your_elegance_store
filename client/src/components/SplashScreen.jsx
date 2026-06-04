import { STORE_LOGO_SRC, applyStoreLogoFallback } from '../config/brandLogo'
import './SplashScreen.css'

const SplashScreen = ({ exiting = false }) => {
  return (
    <div
      className={`splash-screen${exiting ? ' splash-screen--exit' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Your Elegance Store"
    >
      {/* Logo: fixed to viewport center (not flex — reliable on all phones) */}
      <div className="splash-screen__logo-stage">
        <div className="splash-screen__logo-spin">
          <img
            src={STORE_LOGO_SRC}
            alt="Your Elegance Store"
            className="splash-screen__logo"
            fetchPriority="high"
            decoding="async"
            onError={applyStoreLogoFallback}
          />
        </div>
      </div>

      <p className="splash-screen__tagline">Where Style Meets Sophistication</p>
    </div>
  )
}

export default SplashScreen
