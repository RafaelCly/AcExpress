import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  IconTruck, IconLogOut, IconPackage, IconUsers, IconRoute,
  IconRadio, IconAdmin, IconChevronRight,
} from './Icons'

const ROL_LABEL = {
  cliente:    'Cliente',
  acopio:     'Acopio',
  repartidor: 'Repartidor',
  central:    'Central',
  admin:      'Administrador',
}

const NAV_ITEMS = [
  { to: '/pedidos',   label: 'Mis pedidos', icon: IconPackage, roles: ['cliente', 'admin'], modulo: 'cliente' },
  { to: '/acopio',    label: 'Acopio',      icon: IconUsers,   roles: ['acopio', 'admin'],  modulo: 'acopio' },
  { to: '/ruta',      label: 'Mi ruta',     icon: IconRoute,   roles: ['repartidor', 'admin'], modulo: 'ruta' },
  { to: '/monitoreo', label: 'Monitoreo',   icon: IconRadio,   roles: ['central', 'admin'], modulo: 'monitoreo' },
  { to: '/admin',     label: 'Admin',       icon: IconAdmin,   roles: ['admin'], modulo: 'admin' },
]

// Cada módulo tiene su propio acento validado (color domain de ui-ux-pro-max)
// manteniendo el mismo lenguaje visual base — así diferencian secciones
// productos reales como Vercel o GitHub sin perder coherencia de marca.
const MODULO_ACCENT = {
  cliente:    'cliente',
  acopio:     'acopio',
  ruta:       'ruta',
  monitoreo:  'monitoreo',
  admin:      'admin',
}

function iniciales(email) {
  if (!email) return '?'
  return email.slice(0, 2).toUpperCase()
}

export default function AppShell({ user, rol, titulo, children }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const items = NAV_ITEMS.filter(i => i.roles.includes(rol))

  const activo = NAV_ITEMS.find(i => location.pathname.startsWith(i.to))
  const acento = MODULO_ACCENT[activo?.modulo] ?? 'cliente'

  async function cerrarSesion() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className={`shell shell-${acento}`}>
      <button className="shell-menu-btn" onClick={() => setMenuAbierto(v => !v)} aria-label="Abrir menú">
        <IconChevronRight />
      </button>

      <aside className={`sidebar ${menuAbierto ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="logo-icon"><IconTruck /></span>
          <span className="sidebar-brand-text">AC <b>Express</b></span>
        </div>

        <nav className="sidebar-nav">
          {items.map(item => (
            <NavLink
              key={item.to} to={item.to}
              className={({ isActive }) => `sidebar-link sidebar-link-${item.modulo} ${isActive ? 'active' : ''}`}
              onClick={() => setMenuAbierto(false)}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-avatar">{iniciales(user?.email)}</span>
            <div className="sidebar-user-info">
              <span className="sidebar-user-email">{user?.email}</span>
              <span className="role-badge">{ROL_LABEL[rol] ?? rol}</span>
            </div>
          </div>
          <button className="btn-ghost sidebar-logout" onClick={cerrarSesion}>
            <IconLogOut /> Cerrar sesión
          </button>
        </div>
      </aside>

      {menuAbierto && <div className="sidebar-scrim" onClick={() => setMenuAbierto(false)} />}

      <div className="shell-main">
        {titulo && (
          <div className="shell-topbar">
            {activo && <span className="shell-watermark"><activo.icon /></span>}
            <span className="module-dot" />
            <h1 className="shell-title">{titulo}</h1>
          </div>
        )}
        <div className="shell-content">
          {children}
        </div>
      </div>
    </div>
  )
}
