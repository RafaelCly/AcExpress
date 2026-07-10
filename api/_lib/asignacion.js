// Lógica compartida de geocodificación y asignación automática de repartidor,
// usada por api/confirmar-pedido.js (y antes por el webhook de WhatsApp, ya retirado).

// Geocodifica una dirección de texto a lat/lng usando Nominatim (OpenStreetMap, gratis).
// Nominatim exige un User-Agent descriptivo y máximo ~1 request/seg (uso justo).
export async function geocodificar(direccion) {
  if (!direccion) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(direccion + ', Peru')}&format=json&limit=1&countrycodes=pe`
    const r = await fetch(url, { headers: { 'User-Agent': 'ACExpress/1.0 (contacto@acexpress.com)' } })
    const data = await r.json()
    if (!data?.[0]) return null
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) }
  } catch {
    return null
  }
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
