import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconTruck, IconCheck, IconClock, IconAlert, IconPackage } from '../components/Icons'
import MapaSeguimientoCliente from '../components/MapaSeguimientoCliente'

const PASOS = [
  { key: 'registrado', label: 'Pedido registrado' },
  { key: 'acopio',     label: 'En almacén' },
  { key: 'ruta',       label: 'En camino' },
  { key: 'entregado',  label: 'Entregado' },
]

function calcularPaso(pedido) {
  if (pedido.estado_entrega === 'Finalizado') return 3
  if (pedido.estado_entrega === 'En transcurso' || pedido.estado_entrega === 'En incidente') return 2
  if (pedido.estado_acopio === 'Listo') return 1
  return 0
}

export default function Seguimiento() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(undefined)
  const [error, setError] = useState(null)

  const cargar = useCallback(() => {
    supabase.from('seguimiento_publico').select('*').eq('id_pedido', id).single()
      .then(({ data, error }) => {
        if (error || !data) { setError(true); return }
        setPedido(data)
      })
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  // Mientras el pedido está en camino, refresca la posición del repartidor cada 8s
  useEffect(() => {
    if (pedido?.estado_entrega !== 'En transcurso') return
    const intervalo = setInterval(cargar, 8000)
    return () => clearInterval(intervalo)
  }, [pedido?.estado_entrega, cargar])

  if (pedido === undefined && !error) {
    return <div className="public-page-wrapper"><p className="subtitle">Cargando seguimiento...</p></div>
  }

  if (error || !pedido) {
    return (
      <div className="public-page-wrapper">
        <div className="login-form" style={{ textAlign: 'center' }}>
          <div className="brand" style={{ justifyContent: 'center' }}>
            <div className="brand-icon"><IconTruck /></div>
            <h1>AC <span>Express</span></h1>
          </div>
          <p className="subtitle">No encontramos este pedido. Verifica el enlace.</p>
        </div>
      </div>
    )
  }

  const pasoActual = calcularPaso(pedido)
  const incidente = pedido.estado_entrega === 'En incidente'
  const hayMapa = pedido.destino_lat != null && pedido.destino_lng != null

  const info = (
    <div className="login-form" style={{ maxWidth: hayMapa ? 'none' : 460 }}>
      <div className="brand">
        <div className="brand-icon"><IconTruck /></div>
        <h1>AC <span>Express</span></h1>
      </div>
      <p className="subtitle">Seguimiento de tu pedido</p>
      <div className="divider" />

      <div className="seguimiento-pedido">
        <span className="seguimiento-nombre"><IconPackage /> {pedido.nombre_pedido}</span>
        <span className="seguimiento-cliente">{pedido.nombre_cliente}</span>
      </div>

      {incidente && (
        <p className="msg error"><IconAlert /> Hubo una demora con tu pedido. Nuestro equipo ya está al tanto.</p>
      )}

      {!hayMapa && (
        <MapaSeguimientoCliente
          repartidorLat={pedido.repartidor_lat}
          repartidorLng={pedido.repartidor_lng}
          destinoLat={pedido.destino_lat}
          destinoLng={pedido.destino_lng}
        />
      )}

      <div className="timeline">
        {PASOS.map((paso, i) => {
          const activo = i <= pasoActual
          const actual  = i === pasoActual
          return (
            <div key={paso.key} className={`timeline-step ${activo ? 'activo' : ''} ${actual ? 'actual' : ''}`}>
              <span className="timeline-dot">{activo ? <IconCheck /> : <IconClock />}</span>
              <span className="timeline-label">{paso.label}</span>
            </div>
          )
        })}
      </div>

      {pedido.dia_entrega && (
        <p className="msg ok">Fecha de entrega estimada: {pedido.dia_entrega}</p>
      )}

      <p className="form-footer">
        ¿Eres cliente de AC Express? <Link to="/" className="link">Inicia sesión</Link>
      </p>
    </div>
  )

  if (!hayMapa) {
    return <div className="public-page-wrapper">{info}</div>
  }

  return (
    <div className="public-page-wrapper">
      <div className="seguimiento-layout">
        {info}
        <div className="seguimiento-mapa-col">
          <MapaSeguimientoCliente
            repartidorLat={pedido.repartidor_lat}
            repartidorLng={pedido.repartidor_lng}
            destinoLat={pedido.destino_lat}
            destinoLng={pedido.destino_lng}
            alto="100%"
          />
        </div>
      </div>
    </div>
  )
}
