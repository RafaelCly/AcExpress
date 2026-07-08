import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import { IconAdmin, IconUsers, IconPackage, IconAlert, IconCheck } from '../components/Icons'

const ROL_LABEL = { cliente: 'Cliente', acopio: 'Acopio', repartidor: 'Repartidor', central: 'Central', admin: 'Admin' }

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

  return (
    <div className="page-root">
      <PageHeader user={user} rol={rol} titulo="Administración" />

      <div className="page-content page-content-wide">
        <h2 className="card-title"><IconAdmin /> Resumen del sistema</h2>

        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-valor">{s.valor}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
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
      </div>
    </div>
  )
}
