import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconTruck, IconCheck, IconClock, IconAlert, IconPackage } from '../components/Icons'

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

  useEffect(() => {
    supabase.from('seguimiento_publico').select('*').eq('id_pedido', id).single()
      .then(({ data, error }) => {
        if (error || !data) { setError(true); return }
        setPedido(data)
      })
  }, [id])

  if (pedido === undefined && !error) {
    return <div className="login-wrapper"><p className="subtitle">Cargando seguimiento...</p></div>
  }

  if (error || !pedido) {
    return (
      <div className="login-wrapper">
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

  return (
    <div className="login-wrapper">
      <div className="login-form" style={{ maxWidth: 460 }}>
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
    </div>
  )
}
