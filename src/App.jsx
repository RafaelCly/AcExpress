import { Routes, Route } from 'react-router-dom'
import Login        from './pages/Login'
import Registro     from './pages/Registro'
import NuevoPedido  from './pages/NuevoPedido'
import Acopio       from './pages/Acopio'
import Ruta         from './pages/Ruta'
import Monitoreo    from './pages/Monitoreo'
import Admin        from './pages/Admin'
import Seguimiento  from './pages/Seguimiento'
import ConfirmarPedido from './pages/ConfirmarPedido'
import RutaProtegida from './components/RutaProtegida'

function SinAcceso() {
  return (
    <div className="page-wrapper">
      <h1>Sin acceso</h1>
      <p>No tienes permisos para ver esta sección.</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/seguimiento/:id" element={<Seguimiento />} />
      <Route path="/confirmar/:id" element={<ConfirmarPedido />} />

      {/* HU-01/03/04/05: cliente registra e importa pedidos */}
      <Route path="/pedidos" element={
        <RutaProtegida rolesPermitidos={['cliente', 'admin']}>
          <NuevoPedido />
        </RutaProtegida>
      } />

      {/* Sprint 2/3: Acopio marca "Listo" y dispara aviso + asignación */}
      <Route path="/acopio" element={
        <RutaProtegida rolesPermitidos={['acopio', 'admin']}>
          <Acopio />
        </RutaProtegida>
      } />

      {/* Sprint 4: repartidor gestiona su ruta */}
      <Route path="/ruta" element={
        <RutaProtegida rolesPermitidos={['repartidor', 'admin']}>
          <Ruta />
        </RutaProtegida>
      } />

      {/* Sprint 5/6: monitoreo GPS e incidentes */}
      <Route path="/monitoreo" element={
        <RutaProtegida rolesPermitidos={['central', 'admin']}>
          <Monitoreo />
        </RutaProtegida>
      } />

      <Route path="/admin" element={
        <RutaProtegida rolesPermitidos={['admin']}>
          <Admin />
        </RutaProtegida>
      } />

      <Route path="/sin-acceso" element={<SinAcceso />} />
    </Routes>
  )
}
