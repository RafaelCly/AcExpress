import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconTruck, IconLogOut } from './Icons'

const ROL_LABEL = {
  cliente:    'Cliente',
  acopio:     'Acopio',
  repartidor: 'Repartidor',
  central:    'Central',
  admin:      'Administrador',
}

export default function PageHeader({ user, rol, titulo }) {
  const navigate = useNavigate()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="page-header">
      <div className="logo">
        <span className="logo-icon"><IconTruck /></span>
        AC <span>Express</span>
        {titulo && <span className="header-titulo">/ {titulo}</span>}
      </div>
      <div className="header-user">
        <div className="user-info">
          <span className="user-email">{user?.email}</span>
          <span className="role-badge">{ROL_LABEL[rol] ?? rol}</span>
        </div>
        <button className="btn-ghost" onClick={cerrarSesion}>
          <IconLogOut /> Cerrar sesión
        </button>
      </div>
    </header>
  )
}
