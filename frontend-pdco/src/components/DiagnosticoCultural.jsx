import { useState } from 'react'

const RAIO = 54
const ESPESSURA = 20
const ESPESSURA_ATIVA = 25
const CIRCUNFERENCIA = 2 * Math.PI * RAIO

const CRITERIOS = [
    { chave: 'regra', rotulo: 'Regra', cor: 'var(--accent)' },
    { chave: 'mercado', rotulo: 'Mercado', cor: 'var(--tatico)' },
    { chave: 'relacionamento', rotulo: 'Relacionamento', cor: 'var(--green)' },
    { chave: 'inovacao', rotulo: 'Inovação', cor: 'var(--amarelo)' },
]

/** Ponto no anel (cx=cy=70) a `raio` px do centro, no ângulo `graus` (0° = topo, sentido horário). */
function pontoNoAnel(graus, raio) {
    const rad = ((graus - 90) * Math.PI) / 180
    return { x: 70 + raio * Math.cos(rad), y: 70 + raio * Math.sin(rad) }
}

/**
 * Diagnóstico cultural (RCF da consultoria Taigéta): Forças Culturais em
 * gráfico de pizza interativo (SVG puro, mesma técnica de círculo com
 * stroke-dasharray do CultureGauge — sem biblioteca nova) — as 4 fatias
 * normalizadas pela soma (a origem são 4 percentuais independentes, não
 * partes de um todo de 100%), com o valor de cada uma escrito no próprio
 * arco. Passar o mouse (ou focar, no teclado) numa fatia ou na legenda
 * destaca as duas juntas. A Taxa de contaminação vem em lista logo abaixo.
 */
export function DiagnosticoCultural({ dados }) {
    const [destaque, setDestaque] = useState(null)
    const fatias = CRITERIOS.map((c) => ({ ...c, valor: dados.forcas[c.chave] ?? 0 }))
    const total = fatias.reduce((soma, f) => soma + f.valor, 0) || 1

    let acumuladoGraus = 0
    const arcos = fatias.map((f, indice) => {
        const graus = (f.valor / total) * 360
        const comprimento = (f.valor / total) * CIRCUNFERENCIA
        const arco = {
            ...f,
            indice,
            comprimento,
            offset: -((acumuladoGraus / 360) * CIRCUNFERENCIA),
            meio: acumuladoGraus + graus / 2,
            // Fatia pequena demais pro número caber dentro do arco: escreve por fora.
            rotuloFora: graus < 28,
        }
        acumuladoGraus += graus
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
                                        className={`pdco-diagnostico-arco ${destaque === a.chave ? 'pdco-diagnostico-arco-ativo' : ''} ${destaque && destaque !== a.chave ? 'pdco-diagnostico-arco-apagado' : ''}`}
                                        style={{ '--i': a.indice, '--cor-arco': a.cor }}
                                        cx="70"
                                        cy="70"
                                        r={RAIO}
                                        fill="none"
                                        stroke={a.cor}
                                        strokeWidth={destaque === a.chave ? ESPESSURA_ATIVA : ESPESSURA}
                                        strokeDasharray={`${a.comprimento} ${CIRCUNFERENCIA - a.comprimento}`}
                                        strokeDashoffset={a.offset}
                                        transform="rotate(-90 70 70)"
                                        strokeLinecap={arcos.filter((x) => x.comprimento > 0).length > 1 ? 'butt' : 'round'}
                                        onMouseEnter={() => setDestaque(a.chave)}
                                        onMouseLeave={() => setDestaque(null)}
                                    />
                                ),
                        )}
                        {arcos.map((a) => {
                            if (a.comprimento <= 0) return null
                            const ponto = pontoNoAnel(a.meio, a.rotuloFora ? RAIO + ESPESSURA / 2 + 9 : RAIO)
                            return (
                                <text
                                    key={`rotulo-${a.chave}`}
                                    x={ponto.x}
                                    y={ponto.y}
                                    className={`pdco-diagnostico-arco-valor ${a.rotuloFora ? 'pdco-diagnostico-arco-valor-fora' : ''} ${destaque && destaque !== a.chave ? 'pdco-diagnostico-arco-apagado' : ''}`}
                                    style={{ '--i': a.indice, fill: a.rotuloFora ? a.cor : undefined }}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                >
                                    {a.valor}%
                                </text>
                            )
                        })}
                    </svg>
                </div>
                <ul className="pdco-diagnostico-legenda">
                    {fatias.map((f) => (
                        <li
                            key={f.chave}
                            tabIndex={0}
                            className={`${destaque === f.chave ? 'pdco-diagnostico-legenda-ativa' : ''} ${destaque && destaque !== f.chave ? 'pdco-diagnostico-arco-apagado' : ''}`}
                            onMouseEnter={() => setDestaque(f.chave)}
                            onMouseLeave={() => setDestaque(null)}
                            onFocus={() => setDestaque(f.chave)}
                            onBlur={() => setDestaque(null)}
                        >
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
