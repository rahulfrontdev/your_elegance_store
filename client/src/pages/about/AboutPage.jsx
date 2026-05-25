import { useEffect } from 'react'
import AboutStore from '../../components/about/AboutStore'

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const main = document.querySelector('.app-layout__main')
    if (main) main.scrollTop = 0
  }, [])

  return (
    <section>
      <AboutStore />
    </section>
  )
}

export default AboutPage
