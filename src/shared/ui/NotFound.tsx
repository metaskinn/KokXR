import { Link } from 'react-router-dom'
export default function NotFound() {
  return <section className="page"><h1>Sayfa bulunamadı</h1><Link to="/artifacts">Eserlere dön</Link></section>
}
