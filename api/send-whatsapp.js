// Función serverless (Vercel) para enviar mensajes por WhatsApp Cloud API (Meta).
//
// Configura estas variables de entorno en Vercel (Project Settings -> Environment Variables):
//   WHATSAPP_TOKEN     -> token de acceso permanente del System User (Meta for Developers)
//   WHATSAPP_PHONE_ID  -> Phone Number ID de tu número de WhatsApp Business
//
// Sin esas variables configuradas, responde en modo "simulado" (no rompe la demo).
//
// Nota: WhatsApp exige una PLANTILLA aprobada por Meta para mensajes que inicia el
// negocio (fuera de la ventana de 24h de conversación). El envío de texto libre
// aquí funciona con números de prueba y destinatarios verificados en Meta for
// Developers mientras se aprueban las plantillas de producción.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { telefono, mensaje } = req.body ?? {}
  if (!telefono || !mensaje) {
    res.status(400).json({ error: 'Faltan telefono o mensaje' })
    return
  }

  const token   = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    res.status(200).json({ enviado: false, simulado: true })
    return
  }

  const numero = telefono.startsWith('+') ? telefono : `+51${telefono}`

  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numero,
        type: 'text',
        text: { body: mensaje },
      }),
    })

    const data = await r.json()

    if (!r.ok) {
      res.status(r.status).json({ enviado: false, simulado: false, error: data })
      return
    }

    res.status(200).json({ enviado: true, simulado: false, data })
  } catch (err) {
    res.status(500).json({ enviado: false, simulado: false, error: err.message })
  }
}
