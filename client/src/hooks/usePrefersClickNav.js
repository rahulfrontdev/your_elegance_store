import { useEffect, useState } from 'react'

/** True on phones/tablets — nav uses tap only, not hover */
export default function usePrefersClickNav() {
  const [prefersClick, setPrefersClick] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setPrefersClick(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return prefersClick
}
