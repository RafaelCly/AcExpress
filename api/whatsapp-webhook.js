// Webhook de WhatsApp Cloud API (Meta). Configúralo en Meta for Developers ->
// tu app -> WhatsApp -> Configuration -> Webhook:
//   Callback URL:  https://<tu-dominio>/api/whatsapp-webhook
//   Verify token:  el mismo valor que pongas en WHATSAPP_VERIFY_TOKEN (Vercel)
// Suscríbete al campo "messages".
//
// Variables de entorno necesarias (Vercel -> Settings -> Environment Variables):
//   WHATSAPP_TOKEN         -> token de acceso (System User) de Meta
//   WHATSAPP_PHONE_ID      -> Phone Number ID
//   WHATSAPP_VERIFY_TOKEN  -> cualquier string que tú definas, para el handshake
//   OPENAI_API_KEY         -> para interpretar la respuesta en texto libre del cliente
//   SUPABASE_SERVICE_ROLE_KEY -> service role de Supabase (bypassa RLS; solo se usa aquí, server-side)
//   VITE_SUPABASE_URL      -> ya la tienes configurada para el frontend

import { createClient } from '@supabase/supabase-js'
import { enviarWhatsappServer } from './_lib/whatsapp.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function normalizarTelefono(numero) {
  // WhatsApp manda "51987654321" (código de país + número). Nos quedamos con los últimos 9 dígitos.
  const digitos = String(numero ?? '').replace(/\D/g, '')
  return digitos.slice(-9)
}

async function interpretarRespuesta(texto) {
  const hoy = new Date().toISOString().slice(0, 10)
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Hoy es ${hoy}. Extrae de la respuesta del cliente de una empresa de delivery su ` +
              `ubicación de entrega, fecha y hora en la que espera recibir su pedido. Responde SOLO un ` +
              `JSON con las claves: ubicacion (string, direccion o zona mencionada), fecha (string, ` +
              `formato YYYY-MM-DD, resuelve dias relativos como "el jueves" usando la fecha de hoy), ` +
              `hora (string, formato HH:MM en 24h, null si no menciona hora). Si falta un dato, usa null.`,
          },
          { role: 'user', content: texto },
        ],
      }),
    })
    const data = await r.json()
    const contenido = data?.choices?.[0]?.message?.content
    return contenido ? JSON.parse(contenido) : null
  } catch {
    return null
  }
}

// Geocodifica una dirección de texto a lat/lng usando Nominatim (OpenStreetMap, gratis).
// Nominatim exige un User-Agent descriptivo y máximo ~1 request/seg (uso justo).
async function geocodificar(direccion) {
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

async function buscarRepartidorDisponible(horaTexto) {
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

  // De los disponibles por horario, elige al que tenga menos pedidos activos (balanceo simple)
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

export default async function handler(req, res) {
  // Verificación del webhook (Meta hace un GET una sola vez al configurarlo)
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode']
    const token     = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge)
      return
    }
    res.status(403).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  try {
    const mensaje = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!mensaje || mensaje.type !== 'text') {
      res.status(200).json({ ignorado: true })
      return
    }

    const telefono = normalizarTelefono(mensaje.from)
    const texto = mensaje.text.body

    // Busca el pedido más reciente de este cliente que está esperando su respuesta
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('*')
      .eq('telefono_cliente', telefono)
      .eq('estado_acopio', 'Listo')
      .is('ubicacion_destino_cliente', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!pedido) {
      res.status(200).json({ sinPedidoPendiente: true })
      return
    }

    const interpretado = await interpretarRespuesta(texto)
    if (!interpretado) {
      res.status(200).json({ error: 'No se pudo interpretar (falta OPENAI_API_KEY o error de parseo)' })
      return
    }

    const coords = await geocodificar(interpretado.ubicacion)

    await supabase.from('pedidos').update({
      ubicacion_destino_cliente: interpretado.ubicacion || texto,
      dia_entrega: interpretado.fecha || null,
      hora_entrega: interpretado.hora || null,
      destino_lat: coords?.lat ?? null,
      destino_lng: coords?.lng ?? null,
    }).eq('id_pedido', pedido.id_pedido)

    const idRepartidor = await buscarRepartidorDisponible(interpretado.hora)

    if (idRepartidor) {
      await supabase.from('pedidos').update({ id_repartidor: idRepartidor }).eq('id_pedido', pedido.id_pedido)

      const link = `https://${req.headers.host}/seguimiento/${pedido.id_pedido}`
      await enviarWhatsappServer(
        telefono,
        `¡Gracias! Tu pedido "${pedido.nombre_pedido}" fue asignado a un repartidor. ` +
        `Sigue tu entrega en tiempo real aquí: ${link}`
      )
    }

    res.status(200).json({ ok: true, asignado: Boolean(idRepartidor) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
