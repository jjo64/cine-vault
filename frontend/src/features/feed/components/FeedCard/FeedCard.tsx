import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Heart, MessageCircle, Share2, Bookmark, Play, Star, Sparkles, List, Film } from 'lucide-react';
import type { FeedItem, User } from '../../types';
import { ActionBtn } from './ActionBtn';
import { Image } from './Image';
import * as Renderers from './ContentRenderers';


// Type Badge component
const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    review: { label: 'Reseña', icon: <Star size={10} />, color: 'var(--color-gold)' },
    vault: { label: 'Vault', icon: <Play size={10} />, color: 'var(--color-accent)' },
    tonight: { label: 'Esta noche', icon: <Sparkles size={10} />, color: '#E8C98D' },
    discovery: { label: 'Descubrimiento', icon: <Film size={10} />, color: 'var(--color-accent)' },
    list: { label: 'Lista', icon: <List size={10} />, color: 'var(--color-text-soft)' },
    quote: { label: 'Cita', icon: <span style={{ fontSize: 12, lineHeight: 1 }}>"</span>, color: 'var(--color-accent)' },
};

function TypeBadge({ type }: { type: string }) {
    const meta = TYPE_META[type];
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'rgba(8,8,8,0.65)',
            border: `1px solid rgba(255,255,255,0.1)`,
            backdropFilter: 'blur(8px)',
            color: meta.color,
            fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
            {meta.icon} {meta.label}
        </div>
    );
}

export function FeedCard({
    item, idx, liked, bookmarked, likeAnimating,
    onLike, onBookmark, active,
}: {
    item: FeedItem; idx: number; liked: boolean; bookmarked: boolean;
    likeAnimating: boolean; onLike: () => void; onBookmark: () => void; active: boolean;
}) {
    const filmId = 'film' in item ? item.film.id : undefined;
    const user: User | undefined = 'user' in item ? item.user : undefined;

    const renderContent = () => {
        switch (item.type) {
            case 'review': return <Renderers.ReviewContent item={item} />;
            case 'vault': return <Renderers.VaultContent item={item} />;
            case 'tonight': return <Renderers.TonightContent item={item} />;
            case 'discovery': return <Renderers.DiscoveryContent item={item} />;
            case 'list': return <Renderers.ListContent item={item} />;
            case 'quote': return <Renderers.QuoteContent item={item} />;
        }
    };

    return (
        <div
            data-idx={idx}
            className="feed-card"
            style={{
                height: '100vh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--color-bg)',
            }}
        >
            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <Image
                    src={item.bg}
                    alt=""
                    style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        filter: `saturate(0.45) brightness(${active ? 0.55 : 0.35})`,
                        transform: 'scale(1.04)',
                        transition: 'filter 0.6s ease',
                    }}
                />
            </div>

            <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(8,8,8,0.6) 0%, transparent 25%, transparent 45%, rgba(8,8,8,0.75) 70%, rgba(8,8,8,0.97) 100%)' }} />

            {(item.type === 'tonight' || item.type === 'quote') && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: `radial-gradient(ellipse at 20% 80%, var(--color-accent-glow) 0%, transparent 60%)` }} />
            )}

            {item.type === 'vault' && active && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'rgba(8,8,8,0.6)',
                            border: `1.5px solid var(--color-accent)`,
                            backdropFilter: 'blur(16px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 40px var(--color-accent-glow)`,
                        }}
                    >
                        <Play size={26} fill="var(--color-accent)" color="var(--color-accent)" style={{ marginLeft: 4 }} />
                    </motion.div>
                </div>
            )}

            <div style={{ position: 'absolute', top: 80, left: 24, zIndex: 10 }}>
                <TypeBadge type={item.type} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 8 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    position: 'absolute', bottom: 0, left: 0,
                    right: 110, zIndex: 10,
                    padding: '0 24px 36px',
                }}
            >
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'var(--color-accent-glow)',
                            border: `1.5px solid var(--color-accent-dim)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--color-accent)', flexShrink: 0,
                            backdropFilter: 'blur(8px)',
                        }}>
                            {user.avatar}
                        </div>
                        <div>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text)', marginRight: 8 }}>{user.name}</span>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-text-soft)', letterSpacing: '0.06em' }}>{user.handle}</span>
                        </div>
                    </div>
                )}
                {renderContent()}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={active ? { opacity: 1, x: 0 } : { opacity: 0.4, x: 10 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                    position: 'absolute', right: 16, bottom: 90,
                    zIndex: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                }}
            >
                {filmId ? (
                    <Link to={`/film/${filmId}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                            width: 52, height: 78,
                            borderRadius: 2, overflow: 'hidden',
                            border: `1.5px solid var(--color-accent-dim)`,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                            flexShrink: 0,
                            transition: 'transform 0.2s',
                        }}
                        >
                            <Image src={item.bg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6)' }} />
                        </div>
                    </Link>
                ) : (
                    <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'var(--color-accent-glow)',
                        border: `1.5px solid var(--color-accent-dim)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-accent)',
                    }}>
                        <Play size={18} fill="var(--color-accent)" />
                    </div>
                )}
                <ActionBtn
                    icon={<Heart size={18} fill={liked ? 'var(--color-accent)' : 'none'} color={liked ? 'var(--color-accent)' : 'rgba(255,255,255,0.9)'} strokeWidth={1.5} />}
                    count={liked ? item.likes + 1 : item.likes}
                    active={liked}
                    onClick={onLike}
                    animating={likeAnimating}
                />
                <ActionBtn
                    icon={<MessageCircle size={18} strokeWidth={1.5} color="rgba(255,255,255,0.9)" />}
                    count={item.comments}
                    active={false}
                    onClick={() => { }}
                />
                <ActionBtn
                    icon={<Share2 size={18} strokeWidth={1.5} color="rgba(255,255,255,0.9)" />}
                    active={false}
                    onClick={() => { }}
                />
                <ActionBtn
                    icon={<Bookmark size={18} fill={bookmarked ? 'var(--color-accent)' : 'none'} color={bookmarked ? 'var(--color-accent)' : 'rgba(255,255,255,0.9)'} strokeWidth={1.5} />}
                    active={bookmarked}
                    onClick={onBookmark}
                />
            </motion.div>
        </div>
    );
}
