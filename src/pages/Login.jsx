import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const RUTA_POR_ROL = {
  cliente:    '/pedidos',
  acopio:     '/acopio',
  repartidor: '/ruta',
  central:    '/monitoreo',
  admin:      '/admin',
}

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
  </svg>
)

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth
      .signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: perfil } = await supabase
      .from('clientes').select('rol')
      .eq('id_cliente', data.user.id).single()

    navigate(RUTA_POR_ROL[perfil?.rol] ?? '/')
  }

  return (
    <div className="login-wrapper">
      <form onSubmit={onSubmit} className="login-form" noValidate>

        <div className="brand">
          <div className="brand-icon">🚚</div>
          <h1>AC <span>Express</span></h1>
        </div>

        <p className="subtitle">
          Ingresa tus credenciales para acceder al sistema de delivery.
        </p>

        <div className="divider" />

        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="correo@empresa.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <div className="input-eye">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <EyeIcon open={showPass} />
            </button>
          </div>
        </div>

        {error && <p className="msg error">⚠ {error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Verificando...' : 'Iniciar sesión →'}
        </button>

        <p className="form-footer">
          ¿No tienes cuenta? <Link to="/registro" className="link">Regístrate</Link>
        </p>

      </form>
    </div>
  )
}
