import { NavLink, Outlet } from 'react-router-dom'

/** Vazo, kılıç ve çini atölyelerini tek sekmede toplar; her atölye kendi adresini korur. */
export default function Atolyeler() {
  return <>
    <nav className="atolye-gezinme" aria-label="Atölyeler">
      <NavLink to="/atolye/vazo">Vazo atölyesi</NavLink>
      <NavLink to="/atolye/kilic">Kılıç atölyesi</NavLink>
      <NavLink to="/atolye/cini">Çini atölyesi</NavLink>
    </nav>
    <Outlet />
  </>
}
