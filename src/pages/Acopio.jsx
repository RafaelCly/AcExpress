import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import { IconPackage, IconCheck, IconWhatsapp, IconUsers } from '../components/Icons'

function generarLinkSeguimiento(idPedido) {
  return `${window.location.origin}/seguimiento/${idPedido}`
}

function ModalListo({ pedido, repartidores, onClose, onConfirmar }) {
  const [idRepartidor, setIdRepartidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  if (!pedido) return null

  const link = generarLinkSeguimiento(pedido.id_pedido)

  async function confirmar() {
    setEnviando(true)
    await onConfirmar(pedido.id_pedido, idRepartidor || null)
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

          <div className="field">
            <label>Asignar repartidor (opcional)</label>
            <select className="select-input" value={idRepartidor} onChange={e => setIdRepartidor(e.target.value)}>
              <option value="">Sin asignar por ahora</option>
              {repartidores.map(r => (
                <option key={r.id_cliente} value={r.id_cliente}>{r.razon_social || r.email}</option>
              ))}
            </select>
          </div>

          <div className="whatsapp-preview">
            <div className="whatsapp-header">
              <IconWhatsapp /> Vista previa del mensaje (Sprint 3)
            </div>
            <div className="whatsapp-bubble">
              Hola {pedido.nombre_cliente} 👋 tu pedido <b>{pedido.nombre_pedido}</b> ya está listo en almacén.
              Responde con tu <b>ubicación</b> y <b>día de entrega</b> preferido.
              <br /><br />
              Sigue tu pedido aquí: <span className="link-mock">{link}</span>
            </div>
            <p className="mock-note">⚠ Simulación — el envío real por WhatsApp Business API se activa en el Sprint 3.</p>
          </div>

          <button className="btn-primary" disabled={enviando} onClick={confirmar}>
            {enviando ? 'Guardando...' : 'Confirmar y marcar Listo →'}
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
  const [msg, setMsg] = useState(null)

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false })
    if (data) setPedidos(data)
    const { data: reps } = await supabase.from('clientes').select('id_cliente, email, razon_social').eq('rol', 'repartidor')
    if (reps) setRepartidores(reps)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const visibles = pedidos.filter(p => p.estado_acopio === filtro)

  async function confirmarListo(idPedido, idRepartidor) {
    const { error } = await supabase.from('pedidos')
      .update({ estado_acopio: 'Listo', id_repartidor: idRepartidor })
      .eq('id_pedido', idPedido)

    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }
    setMsg({ tipo: 'ok', texto: 'Pedido marcado como Listo. Mensaje simulado enviado.' })
    setModalPedido(null)
    cargar()
  }

  return (
    <div className="page-root">
      <PageHeader user={user} rol={rol} titulo="Acopio" />

      <div className="page-content page-content-wide">
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
      </div>

      <ModalListo
        pedido={modalPedido}
        repartidores={repartidores}
        onClose={() => setModalPedido(null)}
        onConfirmar={confirmarListo}
      />
    </div>
  )
}
