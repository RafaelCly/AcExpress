import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import { IconTruck, IconMapPin } from './Icons'
import 'leaflet/dist/leaflet.css'

function iconoPin(color, IconComponente) {
  const svgs = {
    truck: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7.5" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
    pin:   '<path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  }
  return L.divIcon({
    className: 'leaflet-pin-wrap',
    html: `<div style="color:${color}" class="leaflet-pin"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${svgs[IconComponente]}</svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  })
}

const ICONO_REPARTIDOR = iconoPin('#22d3ee', 'truck')
const ICONO_DESTINO    = iconoPin('#a78bfa', 'pin')

// Ruta real por calles vía OSRM (demo pública, gratis, sin API key — sin SLA de producción)
async function obtenerRuta(origen, destino) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/` +
      `${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`
    const r = await fetch(url)
    const data = await r.json()
    const coords = data?.routes?.[0]?.geometry?.coordinates
    if (!coords) return null
    return coords.map(([lng, lat]) => [lat, lng])
  } catch {
    return null
  }
}

export default function MapaSeguimientoCliente({ repartidorLat, repartidorLng, destinoLat, destinoLng, alto = 220 }) {
  const [ruta, setRuta] = useState(null)

  const hayRepartidor = repartidorLat != null && repartidorLng != null
  const hayDestino     = destinoLat != null && destinoLng != null

  useEffect(() => {
    if (!hayRepartidor || !hayDestino) return
    obtenerRuta(
      { lat: repartidorLat, lng: repartidorLng },
      { lat: destinoLat, lng: destinoLng }
    ).then(setRuta)
  }, [repartidorLat, repartidorLng, destinoLat, destinoLng, hayRepartidor, hayDestino])

  if (!hayDestino) return null

  const centro = hayRepartidor ? [repartidorLat, repartidorLng] : [destinoLat, destinoLng]

  return (
    <div className="map-mock" style={{ marginBottom: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <p className="map-mock-label">
        <IconMapPin /> {hayRepartidor ? 'Tu repartidor en tiempo real' : 'Tu dirección de entrega'}
      </p>
      <div className="map-real-wrap" style={{ flex: 1 }}>
        <MapContainer center={centro} zoom={14} scrollWheelZoom={false} style={{ height: typeof alto === 'number' ? `${alto}px` : alto, width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={[destinoLat, destinoLng]} icon={ICONO_DESTINO}>
            <Popup>Tu dirección de entrega</Popup>
          </Marker>

          {hayRepartidor && (
            <Marker position={[repartidorLat, repartidorLng]} icon={ICONO_REPARTIDOR}>
              <Popup>Tu repartidor</Popup>
            </Marker>
          )}

          {ruta && <Polyline positions={ruta} pathOptions={{ color: '#22d3ee', weight: 4, opacity: 0.8 }} />}
        </MapContainer>
      </div>
      {hayRepartidor && !ruta && (
        <p className="mock-note">Calculando ruta...</p>
      )}
    </div>
  )
}
