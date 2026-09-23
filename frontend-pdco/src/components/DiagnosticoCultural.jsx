const RAIO = 54
const ESPESSURA = 20
const CIRCUNFERENCIA = 2 * Math.PI * RAIO

const CRITERIOS = [
    { chave: 'regra', rotulo: 'Regra', cor: 'var(--accent)' },
    { chave: 'mercado', rotulo: 'Mercado', cor: 'var(--tatico)' },
    { chave: 'relacionamento', rotulo: 'Relacionamento', cor: 'var(--green)' },
    { chave: 'inovacao', rotulo: 'Inovação', cor: 'var(--amarelo)' },
]

/**
 * Diagnóstico cultural (RCF da consultoria Taigéta): Forças Culturais em
 * gráfico de pizza (as 4 fatias — Regra/Mercado/Relacionamento/Inovação —
 * normalizadas pela soma, já que a origem são 4 percentuais independentes,
 * não partes de um todo de 100%) e a Taxa de contaminação como lista logo
 * abaixo. SVG puro (mesma técnica de círculo com stroke-dasharray do
 * CultureGauge), sem biblioteca nova.
 */
export function DiagnosticoCultural({ dados }) {
    const fatias = CRITERIOS.map((c) => ({ ...c, valor: dados.forcas[c.chave] ?? 0 }))
    const total = fatias.reduce((soma, f) => soma + f.valor, 0) || 1

    let acumulado = 0
    const arcos = fatias.map((f) => {
        const comprimento = (f.valor / total) * CIRCUNFERENCIA
        const arco = { ...f, comprimento, offset: -acumulado }
        acumulado += comprimento
        return arco
    })

    return (
        <div className="pdco-diagnostico">
            <div className="pdco-diagnostico-pizza-linha">
                <div className="pdco-diagnostico-pizza" role="img" aria-label={fatias.map((f) => `${f.rotulo} ${f.valor}%`).join(', ')}>
                    <svg viewBox="0 0 140 140" aria-hidden="true">
                        <circle cx="70" cy="70" r={RAIO} fill="none" stroke="var(--border)" strokeWidth={ESPESSURA} />
                        {arcos.map(
                            (a) =>
                                a.comprimento > 0 && (
                                    <circle
                                        key={a.chave}
                                        cx="70"
                                        cy="70"
                                        r={RAIO}
                                        fill="none"
                                        stroke={a.cor}
                                        strokeWidth={ESPESSURA}
                                        strokeDasharray={`${a.comprimento} ${CIRCUNFERENCIA - a.comprimento}`}
                                        strokeDashoffset={a.offset}
                                        transform="rotate(-90 70 70)"
                                        strokeLinecap={arcos.filter((x) => x.comprimento > 0).length > 1 ? 'butt' : 'round'}
                                    />
                                ),
                        )}
                    </svg>
                </div>
                <ul className="pdco-diagnostico-legenda">
                    {fatias.map((f) => (
                        <li key={f.chave}>
                            <span className="pdco-diagnostico-ponto" style={{ background: f.cor }} />
                            <span className="pdco-diagnostico-legenda-rotulo">{f.rotulo}</span>
                            <b>{f.valor}%</b>
                        </li>
                    ))}
                </ul>
            </div>

            {dados.contaminacao.length > 0 ? (
                <div className="pdco-diagnostico-contaminacao">
                    <p className="pdco-diagnostico-contaminacao-titulo">Taxa de contaminação</p>
                    <div className="pdco-diagnostico-contaminacao-grade">
                        {dados.contaminacao.map((c) => (
                            <span className="pdco-diagnostico-contaminacao-item" key={c.codigo}>
                                <b>{c.codigo}</b>
                                {c.valor}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="pdco-diagnostico-contaminacao-titulo">Taxa de contaminação: nenhuma</p>
            )}
        </div>
    )
}
