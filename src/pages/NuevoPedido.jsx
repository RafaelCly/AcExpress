import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const VACIO = {
  nombre_pedido:     '',
  peso:              '',
  telefono_cliente:  '',
  nombre_cliente:    '',
  dia_recojo_origen: '',
  ubicacion_origen:  '',
}

function validar(form) {
  if (!form.nombre_pedido.trim())                 return 'Falta el nombre del pedido'
  if (!/^[0-9]{9}$/.test(form.telefono_cliente)) return 'Teléfono inválido (debe tener 9 dígitos)'
  if (!form.nombre_cliente.trim())                return 'Falta el nombre del cliente'
  return null
}

export default function NuevoPedido() {
  const [form, setForm]       = useState(VACIO)
  const [msg, setMsg]         = useState(null)
  const [loading, setLoading] = useState(false)
  const [pedidos, setPedidos] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const navigate = useNavigate()
  const { user, rol } = useAuth()

  const cargarPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos').select('*')
      .order('created_at', { ascending: false })
    if (data) setPedidos(data)
  }, [])

  useEffect(() => { cargarPedidos() }, [cargarPedidos])

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    const err = validar(form)
    if (err) { setMsg({ tipo: 'error', texto: err }); return }

    setLoading(true)
    setMsg(null)

    const { data: { user: u } } = await supabase.auth.getUser()

    const { error } = await supabase.from('pedidos').insert({
      ...form,
      peso:       form.peso ? Number(form.peso) : null,
      id_cliente: u.id,
    })

    setLoading(false)

    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }

    setMsg({ tipo: 'ok', texto: '¡Pedido registrado correctamente!' })
    setForm(VACIO)
    setMostrarForm(false)
    cargarPedidos()
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="page-root">
      <header className="page-header">
        <div className="logo">🚚 AC <span>Express</span></div>
        <div className="header-user">
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <span className="role-badge">{rol}</span>
          </div>
          <button className="btn-ghost" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <div className="page-content">

        {/* Acciones */}
        <div className="actions-bar">
          <h2 className="card-title">Mis pedidos</h2>
          <div className="actions-btns">
            <button className="btn-excel" disabled title="Disponible en Sprint 2">
              📊 Importar Excel
            </button>
            <button className="btn-primary btn-sm" onClick={() => { setMostrarForm(v => !v); setMsg(null) }}>
              {mostrarForm ? '✕ Cancelar' : '+ Nuevo pedido'}
            </button>
          </div>
        </div>

        {/* Mensaje global */}
        {msg && !mostrarForm && <p className={`msg ${msg.tipo}`}>{msg.tipo === 'ok' ? '✓' : '⚠'} {msg.texto}</p>}

        {/* Formulario */}
        {mostrarForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Nuevo pedido</h3>
            <form onSubmit={onSubmit} noValidate>
              <div className="form-grid">

                <div className="field">
                  <label htmlFor="nombre_pedido">Nombre del pedido <span className="req">*</span></label>
                  <input id="nombre_pedido" name="nombre_pedido"
                    value={form.nombre_pedido} onChange={onChange}
                    placeholder="Ej. Caja de electrónicos" required />
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="nombre_cliente">Cliente <span className="req">*</span></label>
                    <input id="nombre_cliente" name="nombre_cliente"
                      value={form.nombre_cliente} onChange={onChange}
                      placeholder="Nombre completo" required />
                  </div>
                  <div className="field">
                    <label htmlFor="telefono_cliente">Teléfono <span className="req">*</span></label>
                    <input id="telefono_cliente" name="telefono_cliente"
                      value={form.telefono_cliente} onChange={onChange}
                      placeholder="9 dígitos" maxLength={9} inputMode="numeric" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="peso">Peso (kg)</label>
                    <input id="peso" name="peso" type="number" min="0" step="0.1"
                      value={form.peso} onChange={onChange} placeholder="0.0" />
                  </div>
                  <div className="field">
                    <label htmlFor="dia_recojo_origen">Fecha de recojo</label>
                    <input id="dia_recojo_origen" name="dia_recojo_origen" type="date"
                      value={form.dia_recojo_origen} onChange={onChange} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="ubicacion_origen">Dirección de recojo</label>
                  <input id="ubicacion_origen" name="ubicacion_origen"
                    value={form.ubicacion_origen} onChange={onChange}
                    placeholder="Jr. Ejemplo 123, Lima" />
                </div>

                {msg && <p className={`msg ${msg.tipo}`}>{msg.tipo === 'ok' ? '✓' : '⚠'} {msg.texto}</p>}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar pedido →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de pedidos */}
        {pedidos.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📦</p>
            <p className="empty-title">Sin pedidos aún</p>
            <p className="empty-desc">Haz clic en "+ Nuevo pedido" para registrar tu primer envío.</p>
          </div>
        ) : (
          <div className="pedidos-list">
            {pedidos.map(p => (
              <div key={p.id_pedido} className="pedido-card">
                <div className="pedido-info">
                  <span className="pedido-nombre">{p.nombre_pedido}</span>
                  <span className="pedido-cliente">{p.nombre_cliente} · {p.telefono_cliente}</span>
                </div>
                <div className="pedido-estados">
                  <span className={`estado-badge ${p.estado_acopio === 'Listo' ? 'ok' : 'pending'}`}>
                    {p.estado_acopio}
                  </span>
                  <span className={`estado-badge ${p.estado_entrega === 'Finalizado' ? 'ok' : 'pending'}`}>
                    {p.estado_entrega}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
