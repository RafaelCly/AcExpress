// Recibe los datos del formulario público /confirmar/:id que llena el cliente
// (dirección + día/hora de entrega), geocodifica, guarda y asigna repartidor
// automáticamente según horarios fijos. Reemplaza el parseo por IA de respuestas
// de WhatsApp en texto libre: el formulario ya entrega datos estructurados.
//
// Variables de entorno necesarias (Vercel -> Settings -> Environment Variables):
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_ID -> para el mensaje de confirmación con el link de trazabilidad
//   SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL

import { createClient } from '@supabase/supabase-js'
import { enviarWhatsappServer } from './_lib/whatsapp.js'
import { geocodificar, buscarRepartidorDisponible } from './_lib/asignacion.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  try {
    const { id_pedido, direccion, fecha, hora } = req.body ?? {}

    if (!id_pedido || !direccion?.trim() || !fecha || !hora) {
      res.status(400).json({ error: 'Faltan datos: dirección, fecha y hora son obligatorios.' })
      return
    }

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_pedido', id_pedido)
      .eq('estado_acopio', 'Listo')
      .is('ubicacion_destino_cliente', null)
      .single()

    if (!pedido) {
      res.status(404).json({ error: 'Este pedido ya fue confirmado o no existe.' })
      return
    }

    const coords = await geocodificar(direccion)

    await supabase.from('pedidos').update({
      ubicacion_destino_cliente: direccion.trim(),
      dia_entrega: fecha,
      hora_entrega: hora,
      destino_lat: coords?.lat ?? null,
      destino_lng: coords?.lng ?? null,
    }).eq('id_pedido', pedido.id_pedido)

    const idRepartidor = await buscarRepartidorDisponible(supabase, hora)

    let asignado = false
    if (idRepartidor) {
      await supabase.from('pedidos').update({ id_repartidor: idRepartidor }).eq('id_pedido', pedido.id_pedido)
      asignado = true

      const link = `https://${req.headers.host}/seguimiento/${pedido.id_pedido}`
      await enviarWhatsappServer(
        pedido.telefono_cliente,
        `¡Gracias! Tu pedido "${pedido.nombre_pedido}" fue asignado a un repartidor. ` +
        `Sigue tu entrega en tiempo real aquí: ${link}`
      )
    }

    res.status(200).json({ ok: true, asignado })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
