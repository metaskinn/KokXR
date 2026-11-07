import { NavLink, Outlet } from 'react-router-dom'

/** Vazo, kılıç ve çini atölyelerini tek sekmede toplar; her atölye kendi adresini korur. */
export default function WorkshopsLayout() {
  return <>
    <nav className="workshop-nav" aria-label="Atölyeler">
      <NavLink to="/workshops/vase">Vazo atölyesi</NavLink>
      <NavLink to="/workshops/sword">Kılıç atölyesi</NavLink>
      <NavLink to="/workshops/tile">Çini atölyesi</NavLink>
    </nav>
    <Outlet />
  </>
}
