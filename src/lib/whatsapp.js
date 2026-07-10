// Llama a la función serverless /api/send-whatsapp. Si no hay credenciales
// configuradas en Vercel (WHATSAPP_TOKEN / WHATSAPP_PHONE_ID), el backend
// responde { simulado: true } y la UI lo muestra como una simulación,
// sin romper el flujo de la demo.
export async function enviarWhatsapp(telefono, mensaje) {
  try {
    const r = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono, mensaje }),
    })
    return await r.json()
  } catch {
    return { enviado: false, simulado: true }
  }
}
