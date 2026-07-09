import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconTruck } from '../components/Icons'

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


function mensajeError(msg) {
  if (msg?.includes('rate') || msg?.includes('security') || msg?.includes('seconds'))
    return 'Demasiados intentos. Espera unos segundos e intenta de nuevo.'
  if (msg?.includes('already registered') || msg?.includes('duplicate'))
    return 'Este correo ya está registrado. Inicia sesión.'
  if (msg?.includes('password') && msg?.includes('weak'))
    return 'Contraseña muy débil. Usa al menos 6 caracteres.'
  return msg
}

export default function Registro() {
  const [form, setForm] = useState({
    email: '', password: '', confirmar: '', razon_social: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const enviandoRef = useRef(false) // bloqueo síncrono contra doble-clic/doble-submit
  const navigate = useNavigate()

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    if (enviandoRef.current) return
    enviandoRef.current = true
    setError(null)

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      enviandoRef.current = false
      return
    }
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      enviandoRef.current = false
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options:  { data: { razon_social: form.razon_social || null } },
    })

    if (authError) {
      setError(mensajeError(authError.message))
      setLoading(false)
      enviandoRef.current = false
      return
    }

    // Si Supabase exige confirmar el correo, signUp() no entrega sesión activa
    // todavía: no hay forma de insertar en "clientes" (RLS bloquea sin auth.uid()).
    // El perfil se completa en el primer login (ver Login.jsx).
    if (!data.session) {
      setLoading(false)
      setError(null)
      setEmailEnviado(true)
      return
    }

    const { error: dbError } = await supabase.from('clientes').insert({
      id_cliente:   data.user.id,
      login:        form.email,
      email:        form.email,
      razon_social: form.razon_social || null,
      rol:          'cliente',
    })

    if (dbError) {
      setError(mensajeError(dbError.message))
      setLoading(false)
      enviandoRef.current = false
      return
    }

    navigate('/pedidos')
  }

  if (emailEnviado) {
    return (
      <div className="login-wrapper">
        <div className="login-form" style={{ textAlign: 'center' }}>
          <div className="brand" style={{ justifyContent: 'center' }}>
            <div className="brand-icon"><IconTruck /></div>
            <h1>AC <span>Express</span></h1>
          </div>
          <p className="subtitle">
            Te enviamos un correo a <b style={{ color: 'var(--text-main)' }}>{form.email}</b> para confirmar tu cuenta.
            Ábrelo y haz clic en el enlace para poder iniciar sesión.
          </p>
          <p className="form-footer">
            ¿Ya confirmaste? <Link to="/" className="link">Inicia sesión</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrapper">
      <form onSubmit={onSubmit} className="login-form" noValidate>

        <div className="brand">
          <div className="brand-icon"><IconTruck /></div>
          <h1>AC <span>Express</span></h1>
        </div>

        <p className="subtitle">Crea tu cuenta para acceder al sistema.</p>

        <div className="divider" />

        <div className="field">
          <label htmlFor="email">Correo electrónico <span className="req">*</span></label>
          <input id="email" name="email" type="email" autoComplete="email"
            placeholder="correo@empresa.com"
            value={form.email} onChange={onChange} required />
        </div>

        <div className="field">
          <label htmlFor="razon_social">Razón social / Nombre</label>
          <input id="razon_social" name="razon_social" type="text"
            placeholder="Empresa o nombre completo"
            value={form.razon_social} onChange={onChange} />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña <span className="req">*</span></label>
          <div className="input-eye">
            <input id="password" name="password"
              type={showPass ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={onChange} required />
            <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>
              <EyeIcon open={showPass} />
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="confirmar">Confirmar contraseña <span className="req">*</span></label>
          <div className="input-eye">
            <input id="confirmar" name="confirmar"
              type={showConf ? 'text' : 'password'}
              placeholder="Repite la contraseña"
              value={form.confirmar} onChange={onChange} required />
            <button type="button" className="eye-btn" onClick={() => setShowConf(v => !v)}>
              <EyeIcon open={showConf} />
            </button>
          </div>
        </div>

        {error && <p className="msg error">⚠ {error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
        </button>

        <p className="form-footer">
          ¿Ya tienes cuenta? <Link to="/" className="link">Inicia sesión</Link>
        </p>

      </form>
    </div>
  )
}
