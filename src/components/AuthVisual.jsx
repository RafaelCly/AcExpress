import { IconTruck, IconRadio, IconRoute, IconMapPin, IconPackage, IconCheck, IconAlert } from './Icons'

const FEATURES = [
  { icon: IconRadio, text: 'Monitoreo en tiempo real de tus repartidores' },
  { icon: IconRoute,  text: 'Asignación automática y trazabilidad por pedido' },
  { icon: IconMapPin, text: 'Enlace de seguimiento para cada cliente final' },
]

function MockDashboard() {
  return (
    <div className="mock-window">
      <div className="mock-window-bar">
        <span className="mock-dot" style={{ background: '#ef4444' }} />
        <span className="mock-dot" style={{ background: '#f59e0b' }} />
        <span className="mock-dot" style={{ background: '#22c55e' }} />
      </div>
      <div className="mock-body">
        <div className="mock-sidebar">
          <div className="mock-side-item active"><IconPackage /></div>
          <div className="mock-side-item"><IconRoute /></div>
          <div className="mock-side-item"><IconRadio /></div>
        </div>
        <div className="mock-content">
          <div className="mock-stats-row">
            <div className="mock-stat">
              <span className="mock-stat-num">128</span>
              <span className="mock-stat-lbl">Pedidos</span>
            </div>
            <div className="mock-stat">
              <span className="mock-stat-num mock-ok"><IconCheck /> 94</span>
              <span className="mock-stat-lbl">Entregados</span>
            </div>
            <div className="mock-stat">
              <span className="mock-stat-num mock-alert"><IconAlert /> 3</span>
              <span className="mock-stat-lbl">Incidentes</span>
            </div>
          </div>
          <div className="mock-row" />
          <div className="mock-row" style={{ width: '85%' }} />
          <div className="mock-row" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  )
}

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

        <MockDashboard />
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
