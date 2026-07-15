import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

const PANEL_WIDTH = 188
const GAP = 2
const SLOPE_STEP = 10
const CLEAR_MS = 160

function placePanel(anchorRect, depth, openLeftHint = false) {
  const preferredLeft = anchorRect.right + GAP
  const maxLeft = window.innerWidth - PANEL_WIDTH - 12
  const openLeft = openLeftHint || preferredLeft > maxLeft
  const left = openLeft
    ? Math.max(12, anchorRect.left - PANEL_WIDTH - GAP)
    : Math.min(preferredLeft, maxLeft)
  const top = Math.min(
    Math.max(12, anchorRect.top + (depth > 0 ? SLOPE_STEP : 0)),
    window.innerHeight - 160
  )
  return { left, top, openLeft, width: PANEL_WIDTH }
}

/**
 * Slope cascade: each deeper level opens as a flyout stepped down and to the side,
 * not as columns in one horizontal row.
 */
const CategoryNavCascade = ({
  nodes = [],
  onMenuLinkActivate,
  rootLabel = '',
  rootTo = '',
  onKeepOpen,
  onRequestClose,
}) => {
  const navigate = useNavigate()
  const clearTimer = useRef(null)
  const [path, setPath] = useState([])
  const [anchors, setAnchors] = useState([])

  const clearMenus = useCallback(() => {
    setPath([])
    setAnchors([])
  }, [])

  const cancelClear = useCallback(() => {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current)
      clearTimer.current = null
    }
    onKeepOpen?.()
  }, [onKeepOpen])

  const scheduleClear = useCallback(() => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => {
      clearMenus()
      onRequestClose?.()
    }, CLEAR_MS)
  }, [clearMenus, onRequestClose])

  useEffect(() => {
    clearMenus()
  }, [nodes, clearMenus])

  useEffect(() => () => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
  }, [])

  useEffect(() => {
    if (!path.length) return undefined
    const onWin = () => {
      clearMenus()
      onRequestClose?.()
    }
    window.addEventListener('scroll', onWin, true)
    window.addEventListener('resize', onWin)
    return () => {
      window.removeEventListener('scroll', onWin, true)
      window.removeEventListener('resize', onWin)
    }
  }, [path.length, clearMenus, onRequestClose])

  const activate = (to) => (event) => {
    event.preventDefault()
    event.stopPropagation()
    onMenuLinkActivate?.()
    navigate(to)
  }

  const openFromItem = (depth, item, rowEl) => {
    cancelClear()
    const nextPath = path.slice(0, depth)
    const nextAnchors = anchors.slice(0, depth)

    if (!item.children?.length) {
      setPath(nextPath)
      setAnchors(nextAnchors)
      return
    }

    const rect = rowEl.getBoundingClientRect()
    nextPath.push(item.id)
    nextAnchors.push({
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    })
    setPath(nextPath)
    setAnchors(nextAnchors)
  }

  const panels = []
  let currentNodes = nodes
  let openLeft = false

  for (let depth = 0; depth < path.length; depth += 1) {
    const selected = currentNodes.find((item) => String(item.id) === String(path[depth]))
    const anchor = anchors[depth]
    if (!selected?.children?.length || !anchor) break

    const placement = placePanel(anchor, depth, openLeft)
    openLeft = placement.openLeft
    panels.push({
      key: `${depth}-${selected.id}`,
      depth: depth + 1,
      title: selected.name,
      items: selected.children,
      style: {
        top: placement.top,
        left: placement.left,
        width: placement.width,
      },
      openLeft: placement.openLeft,
    })
    currentNodes = selected.children
  }

  const renderList = (items, depth) => (
    <ul className="category-slope__list" role="menu">
      {items.map((item) => {
        const hasChildren = Boolean(item.children?.length)
        const isActive = String(path[depth] || '') === String(item.id)

        return (
          <li key={item.id} className="category-slope__item">
            <a
              href={item.to}
              className={`category-slope__link${isActive ? ' category-slope__link--active' : ''}${
                hasChildren ? ' category-slope__link--branch' : ''
              }`}
              role="menuitem"
              aria-haspopup={hasChildren ? 'true' : undefined}
              aria-expanded={hasChildren ? isActive : undefined}
              onMouseEnter={(event) => {
                const row = event.currentTarget.closest('.category-slope__item')
                if (row) openFromItem(depth, item, row)
              }}
              onFocus={(event) => {
                const row = event.currentTarget.closest('.category-slope__item')
                if (row) openFromItem(depth, item, row)
              }}
              onClick={activate(item.to)}
            >
              <span className="category-slope__label">{item.name}</span>
              {hasChildren ? <span className="category-slope__arrow" aria-hidden>›</span> : null}
            </a>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div
      className="category-slope"
      onMouseEnter={cancelClear}
      onMouseLeave={scheduleClear}
    >
      {rootTo ? (
        <div className="category-slope__header">
          <p className="category-slope__eyebrow">Shop by category</p>
          <a href={rootTo} className="category-slope__root-link" onClick={activate(rootTo)}>
            <span>View all {rootLabel}</span>
            <span aria-hidden>→</span>
          </a>
        </div>
      ) : null}

      <div className="category-slope__root-panel">
        <p className="category-slope__pane-title">{rootLabel || 'Categories'}</p>
        {renderList(nodes, 0)}
      </div>

      {typeof document !== 'undefined' &&
        panels.map((panel) =>
          createPortal(
            <div
              key={panel.key}
              className={`category-slope__flyout${panel.openLeft ? ' category-slope__flyout--left' : ''}`}
              style={panel.style}
              onMouseEnter={cancelClear}
              onMouseLeave={scheduleClear}
            >
              <p className="category-slope__pane-title">{panel.title}</p>
              {renderList(panel.items, panel.depth)}
            </div>,
            document.body
          )
        )}
    </div>
  )
}

export default CategoryNavCascade
