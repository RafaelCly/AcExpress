import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PlaceholderPage({ titulo, sprint }) {
  const navigate = useNavigate()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="page-root">
      <header className="page-header">
        <div className="logo">🚚 AC <span>Express</span></div>
        <button className="btn-ghost" onClick={cerrarSesion}>Cerrar sesión</button>
      </header>

      <div className="placeholder-body">
        {sprint && <span className="badge">📦 {sprint}</span>}
        <h2 className="placeholder-title">{titulo}</h2>
        <p className="placeholder-desc">
          Esta sección se implementará en el próximo sprint. Vuelve pronto.
        </p>
      </div>
    </div>
  )
}
