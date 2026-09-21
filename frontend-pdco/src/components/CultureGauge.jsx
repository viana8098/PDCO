import { useRef, useState } from 'react'
import { movimentoReduzido, useValorAnimado } from '../lib/animacao'
import { nivelDaConclusao } from '../lib/pdcoCalc'

const STROKE = 10
// Cor do anel por nível; a faixa de cada nível (CONCLUSAO_LIMITES) fica em lib/pdcoCalc.js e é a mesma do "i" (InfoConclusao).
const COR_ARCO = { verde: 'var(--green)', amarelo: '#fbbf24', vermelho: 'var(--red)' }

// Anel de progresso circular genérico (SVG puro) — usado no banner executivo
// para "sua área" vs "empresa" e reaproveitável em qualquer % 0-100.
//
// Na primeira entrada o arco é desenhado de 0 até o percentual real enquanto o número
// central conta junto: os dois seguem a mesma curva (uma única animação escreve o
// stroke-dashoffset e o texto), então terminam ao mesmo tempo. Se o valor mudar depois
// (filtro), o arco e o número vão do que está na tela até o novo. No fim, um brilho
// discreto passa uma vez pelo arco. O valor final é sempre o `score` recebido.
export function CultureGauge({ score = 0, size = 108, label = '', suffix = '', atraso = 260 }) {
    const raio = (size - STROKE - 4) / 2
    const circunferencia = 2 * Math.PI * raio
    const pct = Math.max(0, Math.min(100, score))
    const cor = COR_ARCO[nivelDaConclusao(pct)]
    const offsetDe = (v) => circunferencia * (1 - v / 100)

    const arco = useRef(null)
    // Começa vazio (0%) e só chega ao valor pela animação; com movimento reduzido já nasce no valor final.
    const [inicial] = useState(() => (movimentoReduzido() ? pct : 0))
    const [exibido, setExibido] = useState(Math.round(inicial))
    const [brilho, setBrilho] = useState(false)

    useValorAnimado(pct, {
        duracao: 1200,
        atraso,
        aoIniciar: () => setBrilho(false),
        aoQuadro: (v, progresso) => {
            arco.current?.setAttribute('stroke-dashoffset', offsetDe(v))
            setExibido(progresso >= 1 ? Math.round(pct) : Math.round(v))
        },
        aoConcluir: () => setBrilho(true),
    })

    return (
        <div className="pdco-gauge" style={{ width: size, height: size }} role="img" aria-label={`${label ? `${label}: ` : ''}${Math.round(pct)}${suffix}`}>
            <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={raio} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
                <circle
                    ref={arco}
                    cx={size / 2}
                    cy={size / 2}
                    r={raio}
                    fill="none"
                    stroke={cor}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    // Só o ponto de partida: depois disso o atributo é movido pela animação.
                    strokeDashoffset={offsetDe(inicial)}
                    className={`pdco-gauge-value ${brilho ? 'pdco-gauge-brilho' : ''}`}
                    style={{ '--brilho': cor }}
                />
            </svg>
            <div className="pdco-gauge-inner" aria-hidden="true">
                <span className="pdco-gauge-pct" style={{ color: cor, fontSize: size * 0.26 }}>
                    {exibido}
                    {suffix}
                </span>
                {label && <span className="pdco-gauge-label">{label}</span>}
            </div>
        </div>
    )
}
