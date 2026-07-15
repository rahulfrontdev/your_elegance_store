import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Nested accordion for mobile — expands every depth in place.
 */
const CategoryNavTree = ({ nodes = [], onMenuLinkActivate }) => {
  const navigate = useNavigate()

  const handleLinkActivate = (to) => (event) => {
    event.preventDefault()
    event.stopPropagation()
    onMenuLinkActivate?.()
    navigate(to)
  }

  return (
    <ul className="category-nav-tree">
      {nodes.map((node) => (
        <CategoryNavTreeItem
          key={node.id}
          node={node}
          onMenuLinkActivate={onMenuLinkActivate}
          onLinkActivate={handleLinkActivate}
        />
      ))}
    </ul>
  )
}

const CategoryNavTreeItem = ({ node, onMenuLinkActivate, onLinkActivate }) => {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.children?.length > 0

  return (
    <li
      className={`category-nav-tree__item${hasChildren ? ' category-nav-tree__item--has-children' : ''}${
        expanded ? ' category-nav-tree__item--expanded' : ''
      }`}
    >
      <div className="category-nav-tree__row">
        <a href={node.to} className="category-nav-tree__link" onClick={onLinkActivate(node.to)}>
          <span className="category-nav-tree__label">{node.name}</span>
        </a>
        {hasChildren ? (
          <button
            type="button"
            className="category-nav-tree__toggle"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setExpanded((prev) => !prev)
            }}
          >
            {expanded ? '▾' : '›'}
          </button>
        ) : null}
      </div>
      {hasChildren && expanded ? (
        <div className="category-nav-tree__submenu category-nav-tree__submenu--nested" role="group">
          <CategoryNavTree nodes={node.children} onMenuLinkActivate={onMenuLinkActivate} />
        </div>
      ) : null}
    </li>
  )
}

export default CategoryNavTree
