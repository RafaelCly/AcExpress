import readXlsxFile from 'read-excel-file/browser'

// Mapea encabezados de la plantilla (sin tildes, insensible a mayúsculas) a las columnas de "pedidos"
const CAMPOS = {
  'nombre del pedido':   'nombre_pedido',
  'cliente':             'nombre_cliente',
  'telefono':             'telefono_cliente',
  'peso (kg)':           'peso',
  'peso':                'peso',
  'fecha de recojo':     'dia_recojo_origen',
  'direccion de recojo': 'ubicacion_origen',
}

function normalizar(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
}

function fechaAISO(valor) {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10)
  if (typeof valor === 'string' && valor.trim()) return valor.trim()
  return ''
}

export function validarFilaPedido(fila) {
  if (!fila.nombre_pedido?.trim())               return 'Falta el nombre del pedido'
  if (!/^[0-9]{9}$/.test(fila.telefono_cliente)) return 'Teléfono inválido (9 dígitos)'
  if (!fila.nombre_cliente?.trim())               return 'Falta el nombre del cliente'
  return null
}

/**
 * Lee un archivo .xlsx/.xls y devuelve las filas mapeadas a columnas de "pedidos",
 * cada una con su resultado de validación (fila.error === null si es válida).
 */
export async function parsearExcelPedidos(file) {
  // read-excel-file 9.x devuelve un array de hojas [{ sheet, data }]; tomamos
  // las filas de la primera hoja (la plantilla solo tiene una: "Pedidos").
  const hojas = await readXlsxFile(file)
  const filas = hojas?.[0]?.data ?? []

  if (!filas || filas.length < 2) {
    return { pedidos: [], columnasFaltantes: ['nombre_pedido', 'nombre_cliente', 'telefono_cliente'] }
  }

  const encabezados = filas[0].map(normalizar)
  const indice = {}
  encabezados.forEach((h, i) => { if (CAMPOS[h] && !(CAMPOS[h] in indice)) indice[CAMPOS[h]] = i })

  const requeridas = ['nombre_pedido', 'nombre_cliente', 'telefono_cliente']
  const columnasFaltantes = requeridas.filter(c => !(c in indice))

  const pedidos = filas.slice(1)
    .filter(fila => fila.some(c => c !== null && c !== undefined && String(c).trim() !== ''))
    .map((fila, i) => {
      const obj = { _fila: i + 2 }
      for (const [campo, idx] of Object.entries(indice)) {
        let valor = fila[idx]
        if (campo === 'telefono_cliente') valor = String(valor ?? '').replace(/\D/g, '')
        else if (campo === 'peso') valor = valor != null && valor !== '' ? Number(valor) : null
        else if (campo === 'dia_recojo_origen') valor = fechaAISO(valor)
        else valor = String(valor ?? '').trim()
        obj[campo] = valor
      }
      obj.error = validarFilaPedido(obj)
      return obj
    })

  return { pedidos, columnasFaltantes }
}
