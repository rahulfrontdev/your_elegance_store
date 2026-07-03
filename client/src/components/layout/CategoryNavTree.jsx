import { useNavigate } from 'react-router-dom'

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
      {nodes.map((node) => {
        const hasChildren = node.children?.length > 0
        return (
          <li
            key={node.id}
            className={`category-nav-tree__item${hasChildren ? ' category-nav-tree__item--has-children' : ''}`}
          >
            <a href={node.to} className="category-nav-tree__link" onClick={handleLinkActivate(node.to)}>
              <span className="category-nav-tree__label">{node.name}</span>
              {hasChildren ? <span className="category-nav-tree__arrow" aria-hidden>›</span> : null}
            </a>
            {hasChildren ? (
              <div className="category-nav-tree__submenu" role="menu">
                <CategoryNavTree nodes={node.children} onMenuLinkActivate={onMenuLinkActivate} />
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export default CategoryNavTree
