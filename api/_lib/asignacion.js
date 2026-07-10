// Lógica compartida de geocodificación y asignación automática de repartidor,
// usada por api/confirmar-pedido.js (y antes por el webhook de WhatsApp, ya retirado).

async function buscarEnNominatim(consulta) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(consulta)}&format=json&limit=1&countrycodes=pe`
    const r = await fetch(url, { headers: { 'User-Agent': 'ACExpress/1.0 (contacto@acexpress.com)' } })
    const data = await r.json()
    if (!data?.[0]) return null
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) }
  } catch {
    return null
  }
}

// Geocodifica dirección + distrito/ciudad a lat/lng usando Nominatim (OpenStreetMap, gratis).
// El callejero de Perú en OSM tiene poca cobertura a nivel de número de puerta, así que si la
// búsqueda exacta no encuentra nada, se relaja en pasos: primero sin el número, luego solo el
// distrito/ciudad (mejor caer en el lugar correcto de forma aproximada que fallar o desviarse
// a una calle homónima en otra región).
export async function geocodificar(direccion, distrito) {
  if (!direccion && !distrito) return null

  const partes = [direccion, distrito, 'Peru'].filter(Boolean)
  const exacto = await buscarEnNominatim(partes.join(', '))
  if (exacto) return exacto

  if (direccion && distrito) {
    const sinNumero = direccion.replace(/\d+/g, '').replace(/\s+/g, ' ').trim()
    if (sinNumero) {
      const aproximado = await buscarEnNominatim(`${sinNumero}, ${distrito}, Peru`)
      if (aproximado) return aproximado
    }
    const soloDistrito = await buscarEnNominatim(`${distrito}, Peru`)
    if (soloDistrito) return soloDistrito
  }

  return null
}

// Busca, entre los repartidores cuyo horario fijo cubre la hora pedida por el cliente,
// el que tenga menos pedidos activos (balanceo simple). Devuelve null si ninguno calza.
export async function buscarRepartidorDisponible(supabase, horaTexto) {
  if (!horaTexto) return null

  const { data: repartidores } = await supabase
    .from('clientes')
    .select('id_cliente, horario_inicio, horario_fin')
    .eq('rol', 'repartidor')
    .not('horario_inicio', 'is', null)
    .not('horario_fin', 'is', null)

  if (!repartidores?.length) return null

  const disponibles = repartidores.filter(r =>
    horaTexto >= r.horario_inicio.slice(0, 5) && horaTexto <= r.horario_fin.slice(0, 5)
  )
  if (!disponibles.length) return null

  const conCarga = await Promise.all(disponibles.map(async r => {
    const { count } = await supabase
      .from('pedidos')
      .select('id_pedido', { count: 'exact', head: true })
      .eq('id_repartidor', r.id_cliente)
      .neq('estado_entrega', 'Finalizado')
    return { ...r, carga: count ?? 0 }
  }))

  conCarga.sort((a, b) => a.carga - b.carga)
  return conCarga[0].id_cliente
}
