// Envío directo a WhatsApp Cloud API, para usar desde funciones serverless
// (a diferencia de src/lib/whatsapp.js, que llama a /api/send-whatsapp desde el navegador).
export async function enviarWhatsappServer(telefono, mensaje) {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return { enviado: false, simulado: true }

  const numero = telefono.startsWith('+') ? telefono : `+51${telefono}`

  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numero,
        type: 'text',
        text: { body: mensaje },
      }),
    })
    const data = await r.json()
    if (!r.ok) return { enviado: false, simulado: false, error: data }
    return { enviado: true, simulado: false, data }
  } catch (err) {
    return { enviado: false, simulado: false, error: err.message }
  }
}
