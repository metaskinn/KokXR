import { NavLink, Outlet } from 'react-router-dom'

/** Vazo, kılıç ve çini atölyelerini tek sekmede toplar; her atölye kendi adresini korur. */
export default function Workshops() {
  return <>
    <nav className="workshop-nav" aria-label="Atölyeler">
      <NavLink to="/workshop/vase">Vazo atölyesi</NavLink>
      <NavLink to="/workshop/sword">Kılıç atölyesi</NavLink>
      <NavLink to="/workshop/tile">Çini atölyesi</NavLink>
    </nav>
    <Outlet />
  </>
}
