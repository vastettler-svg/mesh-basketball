import { NavLink } from 'react-router-dom'
import '../styles/BottomNav.css'

const navItems = [
  { path: '/', label: 'Home', icon: '⌂' },
  { path: '/scores', label: 'Scores', icon: '▣' },
  { path: '/standings', label: 'Standings', icon: '☷' },
  { path: '/events', label: 'Events', icon: '★' },
  { path: '/stats', label: 'Stats', icon: '▥' },
  { path: '/more', label: 'More', icon: '•••' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `bottom-nav__item ${
                isActive ? 'bottom-nav__item--active' : ''
              }`
            }
          >
            <span className="bottom-nav__icon">
              {item.icon}
            </span>

            <span className="bottom-nav__label">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}