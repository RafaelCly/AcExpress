import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import { enviarWhatsapp } from '../lib/whatsapp'
import MapaRepartidores from '../components/MapaRepartidores'
import { IconRadio, IconAlert, IconWhatsapp, IconClock } from '../components/Icons'

function mensajeIncidente(pedido) {
  return `Hola ${pedido.nombre_cliente}, notamos una demora con tu pedido "${pedido.nombre_pedido}". ` +
    `Nuestro equipo ya está al tanto y te mantendremos informado.`
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
            <div className="whatsapp-header"><IconWhatsapp /> Notificación al cliente</div>
            <div className="whatsapp-bubble">
              Hola {pedido.nombre_cliente}, notamos una demora con tu pedido <b>{pedido.nombre_pedido}</b>.
              Nuestro equipo ya está al tanto y te mantendremos informado.
            </div>
            <p className="mock-note">
              Se envía por WhatsApp Cloud API. Sin credenciales configuradas queda como simulación.
            </p>
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
    const pedido = pedidos.find(p => p.id_pedido === idPedido)

    const { error } = await supabase.from('pedidos')
      .update({ estado_entrega: 'En incidente' })
      .eq('id_pedido', idPedido)

    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }

    const resultado = await enviarWhatsapp(pedido.telefono_cliente, mensajeIncidente(pedido))

    setMsg({
      tipo: 'ok',
      texto: resultado.simulado
        ? 'Incidente registrado. Mensaje simulado (configura WHATSAPP_TOKEN para enviar de verdad).'
        : resultado.enviado
          ? 'Incidente registrado. Cliente notificado por WhatsApp.'
          : 'Incidente registrado, pero el envío de WhatsApp falló.',
    })
    setModalIncidente(null)
    cargar()
  }

  const enRuta = pedidos.filter(p => p.estado_entrega === 'En transcurso')
  const incidentes = pedidos.filter(p => p.estado_entrega === 'En incidente')

  return (
    <AppShell user={user} rol={rol} titulo="Monitoreo">
        <div className="actions-bar">
          <h2 className="card-title"><IconRadio /> Repartidores en tiempo real</h2>
          <span className="badge">{enRuta.length} en ruta · {incidentes.length} con incidente</span>
        </div>

        {msg && <p className={`msg ${msg.tipo}`}>{msg.tipo === 'ok' ? '✓' : '⚠'} {msg.texto}</p>}

        <MapaRepartidores pedidos={pedidos} />

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

      <ModalIncidente
        pedido={modalIncidente}
        onClose={() => setModalIncidente(null)}
        onConfirmar={confirmarIncidente}
      />
    </AppShell>
  )
}
