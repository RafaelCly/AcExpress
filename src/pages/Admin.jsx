import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import { IconUsers, IconPackage, IconAlert, IconCheck } from '../components/Icons'

const ROL_LABEL = { cliente: 'Cliente', acopio: 'Acopio', repartidor: 'Repartidor', central: 'Central', admin: 'Admin' }

const ESTADO_COLOR = {
  'No iniciado':   'var(--text-hint)',
  'En transcurso': 'var(--indigo-400)',
  'En incidente':  'var(--error)',
  'Finalizado':    'var(--success)',
}

export default function Admin() {
  const { user, rol } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [usuarios, setUsuarios] = useState([])

  const cargar = useCallback(async () => {
    const { data: p } = await supabase.from('pedidos').select('*')
    if (p) setPedidos(p)
    const { data: u } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    if (u) setUsuarios(u)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const stats = [
    { label: 'Total pedidos',   valor: pedidos.length, icon: <IconPackage /> },
    { label: 'En incidente',    valor: pedidos.filter(p => p.estado_entrega === 'En incidente').length, icon: <IconAlert /> },
    { label: 'Finalizados',     valor: pedidos.filter(p => p.estado_entrega === 'Finalizado').length, icon: <IconCheck /> },
    { label: 'Usuarios',        valor: usuarios.length, icon: <IconUsers /> },
  ]

  const totalPedidos = pedidos.length || 1
  const distribucion = ['No iniciado', 'En transcurso', 'En incidente', 'Finalizado'].map(estado => ({
    estado,
    cantidad: pedidos.filter(p => p.estado_entrega === estado).length,
  }))

  return (
    <AppShell user={user} rol={rol} titulo="Administración">
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-icon-bg">{s.icon}</span>
              <span className="stat-valor">{s.valor}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Pedidos por estado</h3>
          <div className="chart-bars">
            {distribucion.map(d => (
              <div key={d.estado} className="chart-bar-row">
                <span className="chart-bar-label">{d.estado}</span>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{ width: `${(d.cantidad / totalPedidos) * 100}%`, background: ESTADO_COLOR[d.estado] }}
                  />
                </div>
                <span className="chart-bar-valor">{d.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '2rem' }}><IconUsers /> Usuarios registrados</h3>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr><th>Correo</th><th>Nombre / Razón social</th><th>Rol</th><th>Registrado</th></tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id_cliente}>
                  <td>{u.email}</td>
                  <td>{u.razon_social || '—'}</td>
                  <td><span className="role-badge role-badge-sm">{ROL_LABEL[u.rol] ?? u.rol}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString('es-PE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </AppShell>
  )
}
