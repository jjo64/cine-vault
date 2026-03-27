import { Link } from 'react-router-dom';
import { C, SERIF } from '../constants';

export function Footer() {
  return (
    <footer 
      className="md-footer" 
      style={{ 
        borderTop: `1px solid ${C.border}`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '48px 24px',
        marginTop: '64px'
      }}
    >
      <Link to="/" style={{ fontFamily: SERIF, fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, textDecoration: 'none' }}>
        Cine<span style={{ color: C.accent }}>Vault</span>
      </Link>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textMuted }}>
        &quot;Toda gran colección empieza con una.&quot;
      </div>
    </footer>
  );
}
