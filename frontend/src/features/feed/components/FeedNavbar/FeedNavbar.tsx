import { Link } from 'react-router';
import { Search } from 'lucide-react';

const TABS = ['Para ti', 'Siguiendo', 'Esta noche'];

export function FeedNavbar({ activeTab, onTab }: { activeTab: string; onTab: (t: string) => void }) {
    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 64,
            display: 'flex', alignItems: 'center',
            padding: '0 24px',
            background: 'rgba(8,8,8,0.75)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
            <Link to="/" style={{
                fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 500,
                letterSpacing: '0.13em', textTransform: 'uppercase',
                color: 'var(--color-text)', textDecoration: 'none', flexShrink: 0, marginRight: 32,
            }}>
                Cine<span style={{ color: 'var(--color-accent)' }}>Vault</span>
            </Link>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => onTab(tab)}
                        style={{
                            padding: '6px 18px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
                            color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text-soft)',
                            borderBottom: `2px solid ${activeTab === tab ? 'var(--color-accent)' : 'transparent'}`,
                            paddingBottom: 4,
                            transition: 'color 0.2s, border-color 0.2s',
                            flexShrink: 0,
                        }}
                    >
                        {tab === 'Esta noche' && <span style={{ color: 'var(--color-accent)', marginRight: 5 }}>✦</span>}
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <button style={{ background: 'none', border: `1px solid var(--color-border)`, cursor: 'pointer', color: 'var(--color-text-soft)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={14} />
                </button>
                <Link to="/profile" style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid var(--color-accent-dim)`, display: 'block' }}>
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--color-accent)' }}>M</div>
                </Link>
            </div>
        </nav>
    );
}
