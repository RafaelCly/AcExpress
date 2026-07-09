import { IconTruck, IconRadio, IconRoute, IconMapPin } from './Icons'

const FEATURES = [
  { icon: IconRadio, text: 'Monitoreo en tiempo real de tus repartidores' },
  { icon: IconRoute,  text: 'Asignación automática y trazabilidad por pedido' },
  { icon: IconMapPin, text: 'Enlace de seguimiento para cada cliente final' },
]

export default function AuthVisual() {
  return (
    <div className="auth-visual">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-visual-top">
        <div className="brand">
          <div className="brand-icon"><IconTruck /></div>
          <h1>AC <span>Express</span></h1>
        </div>

        <h2 className="auth-headline">
          La operación de delivery de tu empresa, <span>bajo control total.</span>
        </h2>
        <p className="auth-sub">
          Gestiona pedidos, acopio, repartidores e incidentes desde un solo panel — en tiempo real.
        </p>
      </div>

      <div className="auth-visual-bottom">
        <div className="auth-feature-list">
          {FEATURES.map(f => (
            <div key={f.text} className="auth-feature">
              <span className="auth-feature-icon"><f.icon /></span>
              {f.text}
            </div>
          ))}
        </div>

        <div className="auth-stats">
          <div>
            <div className="auth-stat-num">99.9%</div>
            <div className="auth-stat-label">Disponibilidad</div>
          </div>
          <div>
            <div className="auth-stat-num">5</div>
            <div className="auth-stat-label">Roles operativos</div>
          </div>
          <div>
            <div className="auth-stat-num">24/7</div>
            <div className="auth-stat-label">Trazabilidad</div>
          </div>
        </div>
      </div>
    </div>
  )
}
