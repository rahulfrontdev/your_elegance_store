import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import TermsConditions from '../../components/legal/TermsConditions'

const TermsPage = () => {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const main = document.querySelector('.app-layout__main')
    if (main) main.scrollTop = 0

    if (location.hash) {
      requestAnimationFrame(() => {
        document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [location.pathname, location.hash])

  return (
    <section>
      <TermsConditions />
    </section>
  )
}

export default TermsPage
