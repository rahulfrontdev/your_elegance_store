import { useEffect, useState } from 'react'

function getPrefersClickNav() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

/** True on phones/tablets — nav uses tap only, not hover */
export default function usePrefersClickNav() {
  const [prefersClick, setPrefersClick] = useState(getPrefersClickNav)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setPrefersClick(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return prefersClick
}
