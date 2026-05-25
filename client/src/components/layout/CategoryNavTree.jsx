import { Link } from 'react-router-dom'

const CategoryNavTree = ({ nodes = [], level = 0 }) => {
  return nodes.map((node) => (
    <div key={node.id} className="category-nav-tree__item">
      <Link
        to={node.to}
        className="category-nav-tree__link"
        style={{ paddingLeft: `${1 + level * 0.85}rem` }}
      >
        {level > 0 && <span className="category-nav-tree__branch">-</span>}
        <span>{node.name}</span>
      </Link>
      {node.children?.length > 0 && <CategoryNavTree nodes={node.children} level={level + 1} />}
    </div>
  ))
}

export default CategoryNavTree
