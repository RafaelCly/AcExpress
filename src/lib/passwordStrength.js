const NIVELES = [
  { etiqueta: 'Muy débil', color: '#ef4444' },
  { etiqueta: 'Débil',     color: '#f59e0b' },
  { etiqueta: 'Media',     color: '#eab308' },
  { etiqueta: 'Fuerte',    color: '#22c55e' },
  { etiqueta: 'Muy fuerte', color: '#10b981' },
]

export function evaluarPassword(pass) {
  const criterios = {
    longitud:   pass.length >= 8,
    mayuscula:  /[A-Z]/.test(pass),
    minuscula:  /[a-z]/.test(pass),
    numero:     /[0-9]/.test(pass),
    especial:   /[^A-Za-z0-9]/.test(pass),
  }
  const puntaje = Object.values(criterios).filter(Boolean).length
  const nivel = NIVELES[Math.min(puntaje, 4)]
  const cumpleMinimo = criterios.longitud && criterios.mayuscula && criterios.minuscula && criterios.numero

  return { puntaje, ...nivel, criterios, cumpleMinimo }
}
