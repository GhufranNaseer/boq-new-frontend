import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    color?: string;
    onClick?: () => void;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon: Icon,
    description,
    color = 'var(--primary)',
    onClick,
    trend
}) => {
    return (
        <div
            className="glass-card"
            onClick={onClick}
            style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {title}
                    </p>
                    <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 800 }}>
                        {value}
                    </h2>
                </div>
                <div style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: `rgba(${color === 'var(--primary)' ? '79, 70, 229' : '0, 0, 0'}, 0.1)`,
                    color: color
                }}>
                    <Icon size={24} />
                </div>
            </div>

            <div>
                {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.25rem' }}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: trend.isPositive ? 'var(--success)' : 'var(--error)',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>vs last month</span>
                    </div>
                )}
                {description && (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {description}
                    </p>
                )}
            </div>

            {/* Subtle decorative background element */}
            <div style={{
                position: 'absolute',
                right: '-10px',
                bottom: '-10px',
                opacity: 0.03,
                transform: 'rotate(-15deg)'
            }}>
                <Icon size={80} />
            </div>
        </div>
    );
};

export default StatsCard;
