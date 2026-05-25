import './SplashScreen.css'

const SplashScreen = ({ exiting = false }) => {
  return (
    <div
      className={`splash-screen${exiting ? ' splash-screen--exit' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <img
        src="/your Elegance Store (16).png"
        alt=""
        className="splash-screen__logo"
        onError={(e) => {
          e.currentTarget.src = '/Logo2.png'
        }}
      />
    </div>
  )
}

export default SplashScreen
