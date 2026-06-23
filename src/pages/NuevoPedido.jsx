import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
  const [form, setForm]   = useState(VACIO)
  const [msg, setMsg]     = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    const err = validar(form)
    if (err) { setMsg({ tipo: 'error', texto: err }); return }

    setLoading(true)
    setMsg(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('pedidos').insert({
      ...form,
      peso:       form.peso ? Number(form.peso) : null,
      id_cliente: user.id,
    })

    setLoading(false)

    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }

    setMsg({ tipo: 'ok', texto: '¡Pedido registrado correctamente!' })
    setForm(VACIO)
  }

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

      <div className="page-content">
        <div className="card">
          <h2 className="card-title">Nuevo pedido</h2>
          <p className="card-subtitle">Completa los datos del envío para registrarlo en el sistema.</p>

          <form onSubmit={onSubmit} noValidate>
            <div className="form-grid">

              <div className="field">
                <label htmlFor="nombre_pedido">
                  Nombre del pedido <span className="req">*</span>
                </label>
                <input
                  id="nombre_pedido" name="nombre_pedido"
                  value={form.nombre_pedido} onChange={onChange}
                  placeholder="Ej. Caja de electrónicos"
                  required
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="nombre_cliente">
                    Cliente <span className="req">*</span>
                  </label>
                  <input
                    id="nombre_cliente" name="nombre_cliente"
                    value={form.nombre_cliente} onChange={onChange}
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="telefono_cliente">
                    Teléfono <span className="req">*</span>
                  </label>
                  <input
                    id="telefono_cliente" name="telefono_cliente"
                    value={form.telefono_cliente} onChange={onChange}
                    placeholder="9 dígitos"
                    maxLength={9}
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="peso">Peso (kg)</label>
                  <input
                    id="peso" name="peso" type="number"
                    min="0" step="0.1"
                    value={form.peso} onChange={onChange}
                    placeholder="0.0"
                  />
                </div>

                <div className="field">
                  <label htmlFor="dia_recojo_origen">Fecha de recojo</label>
                  <input
                    id="dia_recojo_origen" name="dia_recojo_origen"
                    type="date"
                    value={form.dia_recojo_origen} onChange={onChange}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="ubicacion_origen">Dirección de recojo</label>
                <input
                  id="ubicacion_origen" name="ubicacion_origen"
                  value={form.ubicacion_origen} onChange={onChange}
                  placeholder="Jr. Ejemplo 123, Lima"
                />
              </div>

              {msg && (
                <p className={`msg ${msg.tipo}`}>
                  {msg.tipo === 'ok' ? '✓' : '⚠'} {msg.texto}
                </p>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar pedido →'}
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
