import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import { IconRadio, IconMapPin, IconAlert, IconWhatsapp, IconClock } from '../components/Icons'

// Genera una posición pseudo-aleatoria pero estable (basada en el id) para el mock de mapa GPS.
// El GPS real se conecta en el Sprint 5 (geolocalización del repartidor vía navigator.geolocation / app móvil).
function posicionMock(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return { top: 10 + (hash % 80), left: 10 + ((hash >> 8) % 80) }
}

function ModalIncidente({ pedido, onClose, onConfirmar }) {
  const [enviando, setEnviando] = useState(false)
  if (!pedido) return null

  async function confirmar() {
    setEnviando(true)
    await onConfirmar(pedido.id_pedido)
    setEnviando(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Reportar incidente</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-mute)', fontSize: '0.875rem' }}>
            Pedido <b style={{ color: 'var(--text-main)' }}>{pedido.nombre_pedido}</b> será marcado
            como <b className="text-danger">En incidente</b>.
          </p>

          <div className="whatsapp-preview">
            <div className="whatsapp-header"><IconWhatsapp /> Notificación al cliente (Sprint 3)</div>
            <div className="whatsapp-bubble">
              Hola {pedido.nombre_cliente}, notamos una demora con tu pedido <b>{pedido.nombre_pedido}</b>.
              Nuestro equipo ya está al tanto y te mantendremos informado.
            </div>
            <p className="mock-note">⚠ Simulación — se conecta a la WhatsApp Business API en el Sprint 3.</p>
          </div>

          <button className="btn-danger" disabled={enviando} onClick={confirmar}>
            {enviando ? 'Guardando...' : 'Confirmar incidente →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Monitoreo() {
  const { user, rol } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [msg, setMsg] = useState(null)
  const [modalIncidente, setModalIncidente] = useState(null)

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos').select('*')
      .in('estado_entrega', ['En transcurso', 'En incidente'])
      .order('created_at', { ascending: false })
    if (data) setPedidos(data)
  }, [])

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 15000) // auto-refresh cada 15s
    return () => clearInterval(intervalo)
  }, [cargar])

  async function confirmarIncidente(idPedido) {
    const { error } = await supabase.from('pedidos')
      .update({ estado_entrega: 'En incidente' })
      .eq('id_pedido', idPedido)

    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }
    setMsg({ tipo: 'ok', texto: 'Incidente registrado y cliente notificado (simulado).' })
    setModalIncidente(null)
    cargar()
  }

  const enRuta = pedidos.filter(p => p.estado_entrega === 'En transcurso')
  const incidentes = pedidos.filter(p => p.estado_entrega === 'En incidente')

  return (
    <div className="page-root">
      <PageHeader user={user} rol={rol} titulo="Monitoreo" />

      <div className="page-content page-content-wide">
        <div className="actions-bar">
          <h2 className="card-title"><IconRadio /> Repartidores en tiempo real</h2>
          <span className="badge">{enRuta.length} en ruta · {incidentes.length} con incidente</span>
        </div>

        {msg && <p className={`msg ${msg.tipo}`}>{msg.tipo === 'ok' ? '✓' : '⚠'} {msg.texto}</p>}

        {/* Mock de mapa GPS — la integración real (Sprint 5) usa ubicación en vivo del repartidor */}
        <div className="map-mock">
          <p className="map-mock-label"><IconMapPin /> Vista de mapa (simulada — Sprint 5 conecta GPS real)</p>
          <div className="map-mock-grid">
            {pedidos.map(p => {
              const pos = posicionMock(p.id_pedido)
              const incidente = p.estado_entrega === 'En incidente'
              return (
                <div
                  key={p.id_pedido}
                  className={`map-pin ${incidente ? 'map-pin-alert' : ''}`}
                  style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                  title={p.nombre_pedido}
                >
                  <IconMapPin />
                </div>
              )
            })}
          </div>
        </div>

        <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '2rem' }}>Pedidos en ruta</h3>
        {pedidos.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon"><IconRadio /></p>
            <p className="empty-title">Sin repartidores activos ahora</p>
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
                  <span className={`estado-badge ${p.estado_entrega === 'En incidente' ? 'danger' : 'ok'}`}>
                    <IconClock /> {p.estado_entrega}
                  </span>
                  {p.estado_entrega !== 'En incidente' && (
                    <button className="btn-danger btn-sm" onClick={() => setModalIncidente(p)}>
                      <IconAlert /> Reportar incidente
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ModalIncidente
        pedido={modalIncidente}
        onClose={() => setModalIncidente(null)}
        onConfirmar={confirmarIncidente}
      />
    </div>
  )
}
