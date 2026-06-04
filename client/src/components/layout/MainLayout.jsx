import { Outlet, useLocation } from 'react-router-dom'
import { NavDropdownProvider } from '../../context/NavDropdownContext'
import Header from './Header'
import SiteNavbar from './SiteNavbar'
import Footer from '../Footer/Footer'
import './MainLayout.css'
import Announcement from './Annoucement'

const MainLayout = () => {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const locationKey = `${location.pathname}${location.search}`

  return (
    <NavDropdownProvider locationKey={locationKey}>
      <div className="app-layout">
        {/* <Announcement /> */}
        <Header />
        <SiteNavbar />
        <main className={`app-layout__main${isHome ? ' app-layout__main--home' : ''}`}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </NavDropdownProvider>
  )
}

export default MainLayout
