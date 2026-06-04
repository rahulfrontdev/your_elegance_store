import { useNavigate } from 'react-router-dom'

const CategoryNavTree = ({ nodes = [], level = 0, onMenuLinkActivate }) => {
  const navigate = useNavigate()

  const handleLinkActivate = (to) => (event) => {
    event.preventDefault()
    event.stopPropagation()
    onMenuLinkActivate?.()
    navigate(to)
  }

  return nodes.map((node) => (
    <div key={node.id} className="category-nav-tree__item">
      <a
        href={node.to}
        className="category-nav-tree__link"
        style={{ paddingLeft: `${1 + level * 0.85}rem` }}
        onClick={handleLinkActivate(node.to)}
      >
        {level > 0 && <span className="category-nav-tree__branch">-</span>}
        <span>{node.name}</span>
      </a>
      {node.children?.length > 0 && (
        <CategoryNavTree
          nodes={node.children}
          level={level + 1}
          onMenuLinkActivate={onMenuLinkActivate}
        />
      )}
    </div>
  ))
}

export default CategoryNavTree
