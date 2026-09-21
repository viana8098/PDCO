import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RAG_BASE, RAG_COLOR, RAG_FAIXA, RAG_LABEL, RAG_REGRA } from '../lib/pdcoCalc'

const NIVEIS = ['verde', 'amarelo', 'vermelho']

// Sinal de menos tipográfico; zero sem sinal.
const pontos = (n) => (n === 0 ? '0' : `−${Math.abs(n)}`)
const pct = (v) => `${Math.round(v * 100)}%`

/**
 * "i" discreto ao lado do status. Ao passar o mouse (ou focar/tocar) abre um balão com a
 * regra do status e, quando `rag` é informado, o passo a passo dos pontos daquele plano.
 * Os números vêm de RAG_REGRA/RAG_FAIXA — as mesmas constantes do cálculo (calcRag) —, então
 * o texto nunca diverge do que a tela realmente faz.
 *
 * O balão é desenhado num portal com posição fixa: assim não é cortado pelos cards/painéis
 * (overflow: hidden) e o clique no "i" não aciona o link do card em que ele está.
 */
export function InfoStatus({ rag }) {
    const id = useId()
    const iconeRef = useRef(null)
    const balaoRef = useRef(null)
    const [aberto, setAberto] = useState(false)
    const [pos, setPos] = useState(null)

    const fechar = () => {
        setAberto(false)
        setPos(null)
    }

    // Posiciona o balão: alinhado à direita do "i", abaixo dele (ou acima, se não couber), sempre dentro da tela.
    useLayoutEffect(() => {
        if (!aberto || !iconeRef.current || !balaoRef.current) return
        const margem = 8
        const i = iconeRef.current.getBoundingClientRect()
        const b = balaoRef.current.getBoundingClientRect()
        const left = Math.min(Math.max(i.right - b.width, margem), window.innerWidth - b.width - margem)
        let top = i.bottom + margem
        if (top + b.height > window.innerHeight - margem && i.top - margem - b.height > margem) top = i.top - margem - b.height
        setPos({ left, top })
    }, [aberto])

    useEffect(() => {
        if (!aberto) return
        const fora = (e) => {
            if (!iconeRef.current?.contains(e.target)) fechar()
        }
        window.addEventListener('scroll', fechar, true)
        window.addEventListener('resize', fechar)
        document.addEventListener('pointerdown', fora)
        return () => {
            window.removeEventListener('scroll', fechar, true)
            window.removeEventListener('resize', fechar)
            document.removeEventListener('pointerdown', fora)
        }
    }, [aberto])

    const P = RAG_REGRA.penalidades
    const alvo = aberto ? (iconeRef.current?.closest('.pdco-app') ?? document.body) : null

    return (
        <>
            <span
                ref={iconeRef}
                className="pdco-info"
                role="button"
                tabIndex={0}
                aria-label="Como o status é calculado"
                aria-describedby={aberto ? id : undefined}
                onMouseEnter={() => setAberto(true)}
                onMouseLeave={fechar}
                onFocus={() => setAberto(true)}
                onBlur={fechar}
                onClick={(e) => {
                    // Dentro de cards que são links: abre o balão em vez de navegar. Nunca fecha no clique
                    // (no toque o mouseenter simulado já abriu); fecha ao tocar fora, rolar ou Esc.
                    e.preventDefault()
                    e.stopPropagation()
                    setAberto(true)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') fechar()
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setAberto(true)
                    }
                }}
            >
                i
            </span>

            {alvo &&
                createPortal(
                    <div
                        id={id}
                        role="tooltip"
                        ref={balaoRef}
                        className="pdco-info-balao"
                        style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
                    >
                        <p className="pdco-info-titulo">Como o status é calculado</p>
                        <p>
                            Todo plano começa com <strong>{RAG_BASE} pontos</strong> e perde pontos por:
                        </p>
                        <ul className="pdco-info-regras">
                            <li>
                                <strong>Execução das ações</strong> (concluídas ÷ total): {pct(RAG_REGRA.execucaoBoa)} ou mais <b>0</b> · de{' '}
                                {pct(RAG_REGRA.execucaoParcial)} a {pct(RAG_REGRA.execucaoBoa - 0.01)} <b>{pontos(P.execucaoParcial)}</b> · menos de{' '}
                                {pct(RAG_REGRA.execucaoParcial)} <b>{pontos(P.execucaoBaixa)}</b> · sem ações <b>{pontos(P.semAcoes)}</b>
                            </li>
                            <li>
                                <strong>Ações atrasadas</strong> (prazo vencido e não concluídas): <b>{pontos(P.porAtraso)}</b> por ação, no máximo{' '}
                                <b>{pontos(P.maxAtrasos)}</b>
                            </li>
                            <li>
                                <strong>Acompanhamento</strong>: último registro há até {RAG_REGRA.diasAcompanhamentoRecente} dias <b>0</b> · há mais
                                de {RAG_REGRA.diasAcompanhamentoRecente} dias <b>{pontos(P.acompanhamentoAntigo)}</b> · nenhum <b>{pontos(P.semAcompanhamento)}</b>
                            </li>
                        </ul>
                        <ul className="pdco-info-niveis">
                            {NIVEIS.map((k) => (
                                <li key={k}>
                                    <span className="pdco-info-bolinha" style={{ backgroundColor: RAG_COLOR[k] }} />
                                    <strong style={{ color: RAG_COLOR[k] }}>{RAG_LABEL[k]}</strong> {RAG_FAIXA[k]}
                                </li>
                            ))}
                        </ul>

                        {rag && (
                            <div className="pdco-info-plano">
                                <p className="pdco-info-titulo">Neste plano: {rag.score} pontos</p>
                                <ul>
                                    {rag.criterios.map((c) => (
                                        <li key={c.chave}>
                                            <span>
                                                <strong>{c.titulo}</strong> — {c.situacao}
                                            </span>
                                            <b className={c.pontos < 0 ? 'pdco-info-neg' : ''}>{pontos(c.pontos)}</b>
                                        </li>
                                    ))}
                                    <li className="pdco-info-resultado" style={{ borderColor: RAG_COLOR[rag.nivel] }}>
                                        <span>
                                            {RAG_BASE} {rag.criterios.map((c) => pontos(c.pontos)).filter((t) => t !== '0').join(' ') || ''} ={' '}
                                            <strong>{rag.score}</strong>
                                        </span>
                                        <b style={{ color: RAG_COLOR[rag.nivel] }}>{RAG_LABEL[rag.nivel]}</b>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>,
                    alvo,
                )}
        </>
    )
}
