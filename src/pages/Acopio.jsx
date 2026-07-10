import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import { enviarWhatsapp } from '../lib/whatsapp'
import { IconPackage, IconCheck, IconWhatsapp, IconUsers, IconAlert } from '../components/Icons'

function generarLinkSeguimiento(idPedido) {
  return `${window.location.origin}/seguimiento/${idPedido}`
}

function generarLinkConfirmacion(idPedido) {
  return `${window.location.origin}/confirmar/${idPedido}`
}

function mensajePreguntaUbicacion(pedido) {
  const link = generarLinkConfirmacion(pedido.id_pedido)
  return `Hola ${pedido.nombre_cliente}, tu pedido "${pedido.nombre_pedido}" ya está listo en almacén. ` +
    `Confirma tu dirección y el día/hora de entrega en este enlace: ${link}`
}

function mensajeAsignado(pedido, link) {
  return `¡Gracias! Tu pedido "${pedido.nombre_pedido}" fue asignado a un repartidor. ` +
    `Sigue tu entrega en tiempo real aquí: ${link}`
}

function ModalListo({ pedido, onClose, onConfirmar }) {
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
          <h3 className="modal-title">Marcar pedido como Listo</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div className="whatsapp-preview">
            <div className="whatsapp-header">
              <IconWhatsapp /> Mensaje que recibirá el cliente
            </div>
            <div className="whatsapp-bubble">
              Hola {pedido.nombre_cliente} 👋 tu pedido <b>{pedido.nombre_pedido}</b> ya está listo en almacén.
              Confirma tu <b>dirección</b> y el <b>día/hora</b> de entrega en este enlace: acexpress.com/confirmar/...
            </div>
            <p className="mock-note">
              Cuando el cliente llena el formulario, el sistema guarda su dirección/fecha/hora exactas y busca
              automáticamente un repartidor libre a esa hora. Si no hay ninguno, aparecerá abajo en
              "Sin repartidor" para asignarlo tú manualmente.
            </p>
          </div>

          <button className="btn-primary" disabled={enviando} onClick={confirmar}>
            {enviando ? 'Guardando...' : 'Confirmar y marcar Listo →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalAsignar({ pedido, repartidores, onClose, onConfirmar }) {
  const [idRepartidor, setIdRepartidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  if (!pedido) return null

  async function confirmar() {
    if (!idRepartidor) return
    setEnviando(true)
    await onConfirmar(pedido.id_pedido, idRepartidor)
    setEnviando(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Asignar repartidor manualmente</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-mute)' }}>
            No se encontró un repartidor disponible automáticamente para
            <b style={{ color: 'var(--text-main)' }}> {pedido.nombre_pedido}</b>
            {pedido.hora_entrega ? ` a las ${pedido.hora_entrega}` : ''}. Elige uno:
          </p>
          <div className="field">
            <label>Repartidor</label>
            <select className="select-input" value={idRepartidor} onChange={e => setIdRepartidor(e.target.value)}>
              <option value="">Selecciona...</option>
              {repartidores.map(r => (
                <option key={r.id_cliente} value={r.id_cliente}>{r.razon_social || r.email}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" disabled={!idRepartidor || enviando} onClick={confirmar}>
            {enviando ? 'Asignando...' : 'Asignar y notificar al cliente →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Acopio() {
  const { user, rol } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [repartidores, setRepartidores] = useState([])
  const [filtro, setFiltro] = useState('No listo')
  const [modalPedido, setModalPedido] = useState(null)
  const [modalAsignar, setModalAsignar] = useState(null)
  const [msg, setMsg] = useState(null)

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false })
    if (data) setPedidos(data)
    const { data: reps } = await supabase.from('clientes').select('id_cliente, email, razon_social').eq('rol', 'repartidor')
    if (reps) setRepartidores(reps)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const visibles = pedidos.filter(p => p.estado_acopio === filtro)
  const sinRepartidor = pedidos.filter(p =>
    p.estado_acopio === 'Listo' && p.ubicacion_destino_cliente && !p.id_repartidor
  )

  async function confirmarListo(idPedido) {
    const pedido = pedidos.find(p => p.id_pedido === idPedido)

    const { error } = await supabase.from('pedidos')
      .update({ estado_acopio: 'Listo' })
      .eq('id_pedido', idPedido)

    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }

    const resultado = await enviarWhatsapp(pedido.telefono_cliente, mensajePreguntaUbicacion(pedido))

    setMsg({
      tipo: 'ok',
      texto: resultado.simulado
        ? 'Pedido marcado como Listo. Mensaje simulado (configura WHATSAPP_TOKEN para enviar de verdad).'
        : resultado.enviado
          ? 'Pedido marcado como Listo. WhatsApp enviado, esperando respuesta del cliente.'
          : 'Pedido marcado como Listo, pero el envío de WhatsApp falló.',
    })
    setModalPedido(null)
    cargar()
  }

  async function confirmarAsignacion(idPedido, idRepartidor) {
    const pedido = pedidos.find(p => p.id_pedido === idPedido)

    const { error } = await supabase.from('pedidos')
      .update({ id_repartidor: idRepartidor })
      .eq('id_pedido', idPedido)

    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }

    const link = generarLinkSeguimiento(idPedido)
    await enviarWhatsapp(pedido.telefono_cliente, mensajeAsignado(pedido, link))

    setMsg({ tipo: 'ok', texto: 'Repartidor asignado y cliente notificado.' })
    setModalAsignar(null)
    cargar()
  }

  return (
    <AppShell user={user} rol={rol} titulo="Acopio">
        <div className="actions-bar">
          <h2 className="card-title"><IconPackage /> Pedidos en almacén</h2>
          <div className="tabs">
            <button className={`tab ${filtro === 'No listo' ? 'active' : ''}`} onClick={() => setFiltro('No listo')}>
              Pendientes ({pedidos.filter(p => p.estado_acopio === 'No listo').length})
            </button>
            <button className={`tab ${filtro === 'Listo' ? 'active' : ''}`} onClick={() => setFiltro('Listo')}>
              Listos ({pedidos.filter(p => p.estado_acopio === 'Listo').length})
            </button>
          </div>
        </div>

        {msg && <p className={`msg ${msg.tipo}`}>{msg.tipo === 'ok' ? '✓' : '⚠'} {msg.texto}</p>}

        {sinRepartidor.length > 0 && (
          <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'var(--module-accent-border)' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
              <IconAlert /> Sin repartidor disponible ({sinRepartidor.length})
            </h3>
            <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
              El cliente ya respondió, pero ningún repartidor tenía horario libre a esa hora. Asígnalo tú.
            </p>
            <div className="pedidos-list">
              {sinRepartidor.map(p => (
                <div key={p.id_pedido} className="pedido-card">
                  <div className="pedido-info">
                    <span className="pedido-nombre">{p.nombre_pedido}</span>
                    <span className="pedido-cliente">
                      {p.nombre_cliente} · {p.ubicacion_destino_cliente}
                      {p.hora_entrega ? ` · ${p.hora_entrega}` : ''}
                    </span>
                  </div>
                  <button className="btn-primary btn-sm" onClick={() => setModalAsignar(p)}>
                    <IconUsers /> Asignar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {visibles.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon"><IconPackage /></p>
            <p className="empty-title">No hay pedidos {filtro.toLowerCase()}</p>
          </div>
        ) : (
          <div className="pedidos-list">
            {visibles.map(p => (
              <div key={p.id_pedido} className="pedido-card">
                <div className="pedido-info">
                  <span className="pedido-nombre">{p.nombre_pedido}</span>
                  <span className="pedido-cliente">{p.nombre_cliente} · {p.telefono_cliente} · {p.peso ? `${p.peso}kg` : 'sin peso'}</span>
                </div>
                <div className="pedido-estados">
                  {p.id_repartidor && <span className="estado-badge ok"><IconUsers /> Asignado</span>}
                  {p.estado_acopio === 'Listo' && !p.ubicacion_destino_cliente && (
                    <span className="estado-badge pending">Esperando respuesta del cliente</span>
                  )}
                  {p.estado_acopio === 'No listo' ? (
                    <button className="btn-primary btn-sm" onClick={() => setModalPedido(p)}>
                      <IconCheck /> Marcar Listo
                    </button>
                  ) : (
                    <span className="estado-badge ok"><IconCheck /> Listo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      <ModalListo pedido={modalPedido} onClose={() => setModalPedido(null)} onConfirmar={confirmarListo} />
      <ModalAsignar
        pedido={modalAsignar}
        repartidores={repartidores}
        onClose={() => setModalAsignar(null)}
        onConfirmar={confirmarAsignacion}
      />
    </AppShell>
  )
}
