const STROKE = 10

// Anel de progresso circular genérico (SVG puro) — usado no banner executivo
// para "sua área" vs "empresa" e reaproveitável em qualquer % 0-100.
export function CultureGauge({ score = 0, size = 108, label = '', suffix = '' }) {
    const raio = (size - STROKE - 4) / 2
    const circunferencia = 2 * Math.PI * raio
    const pct = Math.max(0, Math.min(100, score))
    const offset = circunferencia * (1 - pct / 100)
    const cor = pct >= 70 ? 'var(--green)' : pct >= 45 ? '#fbbf24' : 'var(--red)'

    return (
        <div className="pdco-gauge" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={raio} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={raio}
                    fill="none"
                    stroke={cor}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={offset}
                    className="pdco-gauge-value"
                />
            </svg>
            <div className="pdco-gauge-inner">
                <span className="pdco-gauge-pct" style={{ color: cor, fontSize: size * 0.26 }}>
                    {Math.round(pct)}
                    {suffix}
                </span>
                {label && <span className="pdco-gauge-label">{label}</span>}
            </div>
        </div>
    )
}
