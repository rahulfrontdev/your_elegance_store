import { useEffect } from 'react'
import PrivacyPolicy from '../../components/legal/PrivacyPolicy'

const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const main = document.querySelector('.app-layout__main')
    if (main) main.scrollTop = 0
  }, [])

  return (
    <section>
      <PrivacyPolicy />
    </section>
  )
}

export default PrivacyPolicyPage
