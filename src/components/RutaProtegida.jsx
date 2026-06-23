import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Envuelve rutas que requieren autenticación y opcionalmente un rol específico.
 * rolesPermitidos: array de strings, ej. ['cliente', 'admin']
 */
export default function RutaProtegida({ children, rolesPermitidos }) {
  const { user, rol, cargando } = useAuth()

  if (cargando) return <p style={{ padding: '2rem' }}>Cargando...</p>

  if (!user) return <Navigate to="/" replace />

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to="/sin-acceso" replace />
  }

  return children
}
