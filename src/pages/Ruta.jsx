import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import { IconRoute, IconMapPin, IconCheck, IconClock, IconRadio } from '../components/Icons'

const SIGUIENTE_ESTADO = {
  'No iniciado':  { label: 'Iniciar ruta',        next: 'En transcurso' },
  'En transcurso':{ label: 'Marcar entregado',    next: 'Finalizado' },
}

function restarMinutos(horaHHMM, minutos) {
  const [h, m] = horaHHMM.split(':').map(Number)
  const total = h * 60 + m - minutos
  const hh = Math.floor(((total % 1440) + 1440) % 1440 / 60)
  const mm = ((total % 60) + 60) % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

// Calcula cuándo debería salir el repartidor para llegar a tiempo, usando la
// ruta real (OSRM, gratis) entre su posición actual y el destino del cliente.
function RecomendacionSalida({ pedido }) {
  const [minutos, setMinutos] = useState(null)

  useEffect(() => {
    if (!pedido.hora_entrega || pedido.destino_lat == null || pedido.destino_lng == null) return
    if (!('geolocation' in navigator)) return

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/` +
          `${pos.coords.longitude},${pos.coords.latitude};${pedido.destino_lng},${pedido.destino_lat}?overview=false`
        const r = await fetch(url)
        const data = await r.json()
        const segundos = data?.routes?.[0]?.duration
        if (segundos != null) setMinutos(Math.round(segundos / 60))
      } catch { /* sin conexión a OSRM, se omite la recomendación */ }
    }, () => {})
  }, [pedido.hora_entrega, pedido.destino_lat, pedido.destino_lng])

  if (minutos == null || !pedido.hora_entrega) return null

  const horaSalida = restarMinutos(pedido.hora_entrega.slice(0, 5), minutos + 5)

  return (
    <span className="badge" title="Estimado con tráfico normal, incluye 5 min de margen">
      <IconClock /> Sal antes de las {horaSalida} · ~{minutos} min de viaje
    </span>
  )
}

function TarjetaHorario({ userId }) {
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    supabase.from('clientes').select('horario_inicio, horario_fin').eq('id_cliente', userId).single()
      .then(({ data }) => {
        if (data?.horario_inicio) setInicio(data.horario_inicio.slice(0, 5))
        if (data?.horario_fin)    setFin(data.horario_fin.slice(0, 5))
      })
  }, [userId])

  async function guardar() {
    setGuardando(true)
    setError(null)
    const { error: err } = await supabase.from('clientes')
      .update({ horario_inicio: inicio || null, horario_fin: fin || null })
      .eq('id_cliente', userId)
    setGuardando(false)
    if (err) { setError(err.message); return }
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2500)
  }

  return (
    <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem 1.5rem' }}>
      <h3 className="card-title" style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}><IconClock /> Mi horario de trabajo</h3>
      <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
        Se usa para asignarte pedidos automáticamente según la hora que pida el cliente.
      </p>
      <div className="form-row">
        <div className="field">
          <label>Desde</label>
          <input type="time" value={inicio} onChange={e => setInicio(e.target.value)} />
        </div>
        <div className="field">
          <label>Hasta</label>
          <input type="time" value={fin} onChange={e => setFin(e.target.value)} />
        </div>
      </div>
      <button className="btn-primary btn-sm" style={{ marginTop: '0.85rem' }} disabled={guardando} onClick={guardar}>
        {guardando ? 'Guardando...' : guardado ? '✓ Guardado' : 'Guardar horario'}
      </button>
      {error && <p className="msg error" style={{ marginTop: '0.75rem' }}>⚠ {error}</p>}
    </div>
  )
}

export default function Ruta() {
  const { user, rol } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [msg, setMsg] = useState(null)
  const [actualizando, setActualizando] = useState(null)
  const [gpsActivo, setGpsActivo] = useState(false)
  const watchIdRef = useRef(null)

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

  // Mientras haya al menos un pedido "En transcurso", comparte la ubicación real
  // del navegador (sin API key) para que Central lo vea en el mapa de Monitoreo.
  useEffect(() => {
    const hayRutaActiva = pedidos.some(p => p.estado_entrega === 'En transcurso')

    if (!hayRutaActiva || !user?.id || !('geolocation' in navigator)) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
        setGpsActivo(false)
      }
      return
    }

    if (watchIdRef.current !== null) return // ya está compartiendo

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setGpsActivo(true)
        await supabase.from('ubicaciones_repartidor').upsert({
          id_repartidor: user.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updated_at: new Date().toISOString(),
        })
      },
      () => setGpsActivo(false),
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 10000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [pedidos, user?.id])

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
        <TarjetaHorario userId={user?.id} />

        <div className="actions-bar">
          <h2 className="card-title"><IconRoute /> Pedidos asignados hoy</h2>
          {gpsActivo && (
            <span className="badge"><IconRadio /> GPS compartido con Central</span>
          )}
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
                    {p.ubicacion_destino_cliente && (
                      <span className="pedido-direccion"><IconMapPin /> {p.ubicacion_destino_cliente}
                        {p.hora_entrega && ` · Cliente espera a las ${p.hora_entrega.slice(0, 5)}`}
                      </span>
                    )}
                    {p.estado_entrega === 'No iniciado' && <RecomendacionSalida pedido={p} />}
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
