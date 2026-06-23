import { Routes, Route } from 'react-router-dom'
import Login        from './pages/Login'
import Registro     from './pages/Registro'
import NuevoPedido  from './pages/NuevoPedido'
import PlaceholderPage from './pages/PlaceholderPage'
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

      {/* HU-01 / HU-03: cliente registra pedidos */}
      <Route path="/pedidos" element={
        <RutaProtegida rolesPermitidos={['cliente', 'admin']}>
          <NuevoPedido />
        </RutaProtegida>
      } />

      {/* Sprint 2 — Acopio */}
      <Route path="/acopio" element={
        <RutaProtegida rolesPermitidos={['acopio', 'admin']}>
          <PlaceholderPage titulo="Panel de Acopio" sprint="Sprint 2" />
        </RutaProtegida>
      } />

      <Route path="/ruta" element={
        <RutaProtegida rolesPermitidos={['repartidor', 'admin']}>
          <PlaceholderPage titulo="Panel del Repartidor" sprint="Sprint 4" />
        </RutaProtegida>
      } />

      <Route path="/monitoreo" element={
        <RutaProtegida rolesPermitidos={['central', 'admin']}>
          <PlaceholderPage titulo="Centro de Monitoreo GPS" sprint="Sprint 5" />
        </RutaProtegida>
      } />

      <Route path="/admin" element={
        <RutaProtegida rolesPermitidos={['admin']}>
          <PlaceholderPage titulo="Panel de Administración" sprint="Admin" />
        </RutaProtegida>
      } />

      <Route path="/sin-acceso" element={<SinAcceso />} />
    </Routes>
  )
}
