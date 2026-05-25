import { useEffect } from 'react'
import ReturnRefundPolicy from '../../components/legal/ReturnRefundPolicy'

const ReturnPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const main = document.querySelector('.app-layout__main')
    if (main) main.scrollTop = 0
  }, [])

  return (
    <section>
      <ReturnRefundPolicy />
    </section>
  )
}

export default ReturnPolicyPage
