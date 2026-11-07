import { NavLink, Outlet } from 'react-router-dom'

/** Groups the vase and sword workshops under one tab; each workshop keeps its own address. */
export default function WorkshopsLayout() {
  return <>
    <nav className="workshop-nav" aria-label="Atölyeler">
      <NavLink to="/workshops/vase">Vazo atölyesi</NavLink>
      <NavLink to="/workshops/sword">Kılıç atölyesi</NavLink>
    </nav>
    <Outlet />
  </>
}
