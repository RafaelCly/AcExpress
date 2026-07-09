import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import { IconRoute, IconMapPin, IconCheck, IconClock } from '../components/Icons'

const SIGUIENTE_ESTADO = {
  'No iniciado':  { label: 'Iniciar ruta',        next: 'En transcurso' },
  'En transcurso':{ label: 'Marcar entregado',    next: 'Finalizado' },
}

export default function Ruta() {
  const { user, rol } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [msg, setMsg] = useState(null)
  const [actualizando, setActualizando] = useState(null)

  const cargar = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('pedidos').select('*')
      .eq('id_repartidor', user.id)
      .neq('estado_entrega', 'Finalizado')
      .order('created_at', { ascending: true })
    if (data) setPedidos(data)
  }, [user?.id])

  useEffect(() => { cargar() }, [cargar])

  async function avanzarEstado(pedido) {
    const accion = SIGUIENTE_ESTADO[pedido.estado_entrega]
    if (!accion) return
    setActualizando(pedido.id_pedido)

    const { error } = await supabase.from('pedidos')
      .update({ estado_entrega: accion.next })
      .eq('id_pedido', pedido.id_pedido)

    setActualizando(null)
    if (error) { setMsg({ tipo: 'error', texto: error.message }); return }
    setMsg({ tipo: 'ok', texto: `Pedido actualizado: ${accion.next}` })
    cargar()
  }

  return (
    <AppShell user={user} rol={rol} titulo="Mi ruta">
        <div className="actions-bar">
          <h2 className="card-title"><IconRoute /> Pedidos asignados hoy</h2>
        </div>

        {msg && <p className={`msg ${msg.tipo}`}>{msg.tipo === 'ok' ? '✓' : '⚠'} {msg.texto}</p>}

        {pedidos.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon"><IconRoute /></p>
            <p className="empty-title">Sin pedidos asignados</p>
            <p className="empty-desc">Cuando Acopio te asigne un pedido, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="pedidos-list">
            {pedidos.map(p => {
              const accion = SIGUIENTE_ESTADO[p.estado_entrega]
              return (
                <div key={p.id_pedido} className="pedido-card pedido-card-vert">
                  <div className="pedido-info">
                    <span className="pedido-nombre">{p.nombre_pedido}</span>
                    <span className="pedido-cliente">{p.nombre_cliente} · {p.telefono_cliente}</span>
                    {p.ubicacion_origen && (
                      <span className="pedido-direccion"><IconMapPin /> {p.ubicacion_origen}</span>
                    )}
                  </div>
                  <div className="pedido-estados">
                    <span className={`estado-badge ${p.estado_entrega === 'En transcurso' ? 'ok' : 'pending'}`}>
                      <IconClock /> {p.estado_entrega}
                    </span>
                    {accion && (
                      <button
                        className="btn-primary btn-sm"
                        disabled={actualizando === p.id_pedido}
                        onClick={() => avanzarEstado(p)}
                      >
                        <IconCheck /> {actualizando === p.id_pedido ? 'Actualizando...' : accion.label}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </AppShell>
  )
}
