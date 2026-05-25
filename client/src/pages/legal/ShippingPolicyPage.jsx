import { useEffect } from 'react'
import ShippingPolicy from '../../components/legal/ShippingPolicy'

const ShippingPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const main = document.querySelector('.app-layout__main')
    if (main) main.scrollTop = 0
  }, [])

  return (
    <section>
      <ShippingPolicy />
    </section>
  )
}

export default ShippingPolicyPage
