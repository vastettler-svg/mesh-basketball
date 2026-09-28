import '../styles/Header.css'
import mbaLogo from '../assets/mba-logo.png'

export default function Header() {
  return (
    <header className="mesh-header">
      <div className="mesh-header__inner">
        <div className="mesh-header__brand">
          <img
            src={mbaLogo}
            alt="MBA"
            className="mesh-header__logo"
          />

          <div className="mesh-header__title">
            <span className="mesh-header__mesh">MESH</span>
            <span className="mesh-header__sport">BASKETBALL</span>
          </div>
        </div>
      </div>
    </header>
  )
}