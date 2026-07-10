import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { IconTruck, IconMapPin, IconCheck } from '../components/Icons'

export default function ConfirmarPedido() {
  const { id } = useParams()
  const [direccion, setDireccion] = useState('')
  const [distrito, setDistrito] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const r = await fetch('/api/confirmar-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: id, direccion, distrito, fecha, hora }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'No se pudo confirmar el pedido.'); return }
      setResultado(data)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="public-page-wrapper">
      <div className="login-form" style={{ maxWidth: 460 }}>
        <div className="brand">
          <div className="brand-icon"><IconTruck /></div>
          <h1>AC <span>Express</span></h1>
        </div>
        <p className="subtitle">Confirma los datos de tu entrega</p>
        <div className="divider" />

        {resultado ? (
          <>
            <p className="msg ok">
              <IconCheck /> ¡Listo! {resultado.asignado
                ? 'Ya asignamos un repartidor a tu pedido.'
                : 'Registramos tus datos, en breve te asignaremos un repartidor.'}
            </p>
            <p className="form-footer">
              <Link to={`/seguimiento/${id}`} className="link">Ver seguimiento de mi pedido →</Link>
            </p>
          </>
        ) : (
          <form onSubmit={enviar}>
            <div className="field">
              <label><IconMapPin /> Dirección de entrega</label>
              <input
                type="text"
                placeholder="Ej. Av. Larco 123"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Distrito / ciudad</label>
              <input
                type="text"
                placeholder="Ej. Miraflores, Lima"
                value={distrito}
                onChange={e => setDistrito(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Fecha en que esperas tu pedido</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
              </div>
              <div className="field">
                <label>Hora aproximada</label>
                <input type="time" value={hora} onChange={e => setHora(e.target.value)} required />
              </div>
            </div>

            {error && <p className="msg error">⚠ {error}</p>}

            <button className="btn-primary" disabled={enviando} style={{ marginTop: '0.5rem' }}>
              {enviando ? 'Enviando...' : 'Confirmar datos de entrega'}
            </button>
          </form>
        )}

        <p className="form-footer">
          ¿Eres cliente de AC Express? <Link to="/" className="link">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
