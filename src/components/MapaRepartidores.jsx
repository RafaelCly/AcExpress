import { useState, useEffect, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { IconMapPin } from './Icons'
import 'leaflet/dist/leaflet.css'

const LIMA_CENTRO = [-12.0464, -77.0428]

function iconoPin(color) {
  return L.divIcon({
    className: 'leaflet-pin-wrap',
    html: `<div style="color:${color}" class="leaflet-pin"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  })
}

const ICONO_OK = iconoPin('#22d3ee')
const ICONO_ALERTA = iconoPin('#ef4444')

export default function MapaRepartidores({ pedidos }) {
  const [ubicaciones, setUbicaciones] = useState([])

  const idsRepartidor = useMemo(
    () => [...new Set(pedidos.filter(p => p.id_repartidor).map(p => p.id_repartidor))],
    [pedidos]
  )

  const cargarUbicaciones = useCallback(async () => {
    if (idsRepartidor.length === 0) { setUbicaciones([]); return }
    const { data } = await supabase
      .from('ubicaciones_repartidor')
      .select('*')
      .in('id_repartidor', idsRepartidor)
    if (data) setUbicaciones(data)
  }, [idsRepartidor])

  useEffect(() => {
    cargarUbicaciones()
    const intervalo = setInterval(cargarUbicaciones, 8000)
    return () => clearInterval(intervalo)
  }, [cargarUbicaciones])

  const marcadores = pedidos
    .map(p => {
      const ubic = ubicaciones.find(u => u.id_repartidor === p.id_repartidor)
      if (!ubic) return null
      return { pedido: p, lat: ubic.lat, lng: ubic.lng, actualizado: ubic.updated_at }
    })
    .filter(Boolean)

  return (
    <div className="map-mock">
      <p className="map-mock-label">
        <IconMapPin /> {marcadores.length > 0
          ? `${marcadores.length} repartidor${marcadores.length !== 1 ? 'es' : ''} con GPS activo`
          : 'Sin ubicación GPS todavía — el repartidor debe abrir "Mi ruta" y aceptar el permiso de ubicación'}
      </p>
      <div className="map-real-wrap">
        <MapContainer center={LIMA_CENTRO} zoom={12} scrollWheelZoom={false} style={{ height: '260px', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {marcadores.map(m => (
            <Marker
              key={m.pedido.id_pedido}
              position={[m.lat, m.lng]}
              icon={m.pedido.estado_entrega === 'En incidente' ? ICONO_ALERTA : ICONO_OK}
            >
              <Popup>
                <b>{m.pedido.nombre_pedido}</b><br />
                {m.pedido.nombre_cliente}<br />
                {m.pedido.estado_entrega}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
