import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
  getPageTitle,
} from '../config/siteMeta'

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

const PageMeta = () => {
  const { pathname } = useLocation()

  const applyMeta = () => {
    const title = getPageTitle(pathname)
    document.title = title

    setMeta('name', 'description', SITE_DESCRIPTION)
    setMeta('name', 'title', title)
    setMeta('name', 'application-name', SITE_NAME)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', SITE_DESCRIPTION)
    setMeta('property', 'og:url', `${SITE_URL}${pathname === '/' ? '' : pathname}`)
    setMeta('property', 'og:image', `${SITE_URL}${SITE_OG_IMAGE}`)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', SITE_DESCRIPTION)
  }

  useLayoutEffect(() => {
    applyMeta()
  }, [pathname])

  return null
}

export default PageMeta
