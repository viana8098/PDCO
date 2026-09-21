import { useRef, useState } from 'react'
import { atrasoDoItem, movimentoReduzido, useValorAnimado } from '../lib/animacao'

/**
 * Número que conta de 0 até o valor real na primeira entrada (e, se o valor mudar depois,
 * do que está na tela até o novo). O texto final é sempre o valor recebido. É um único elemento
 * (sem cópia escondida): assim copiar/ler o texto da tela nunca duplica o número.
 */
export function ContadorAnimado({ valor, sufixo = '', duracao = 900, atraso = 0 }) {
    const [exibido, setExibido] = useState(() => (movimentoReduzido() ? valor : 0))
    useValorAnimado(valor, {
        duracao,
        atraso,
        aoQuadro: (v, progresso) => setExibido(progresso >= 1 ? valor : Math.round(v)),
    })
    return (
        <span>
            {exibido}
            {sufixo}
        </span>
    )
}

/**
 * Bloco de progresso de um plano (rótulo + percentual + barra) usado por PlanCard e PlanRow.
 * A barra e o percentual seguem a mesma curva: crescem juntos até o valor real, em cascata
 * conforme o `indice` do plano na lista. A barra é movida por transform (barata) e ganha um
 * brilho na ponta só enquanto cresce; a cor semântica (status) vem pronta de quem chama.
 */
export function ProgressoAcoes({ rotulo, pct, cor, indice = 0 }) {
    const preenchimento = useRef(null)
    const [inicial] = useState(() => (movimentoReduzido() ? pct : 0))
    const [exibido, setExibido] = useState(inicial)

    useValorAnimado(pct, {
        duracao: 850,
        atraso: atrasoDoItem(indice),
        aoIniciar: () => preenchimento.current?.classList.add('pdco-barra-crescendo'),
        aoQuadro: (v, progresso) => {
            if (preenchimento.current) preenchimento.current.style.transform = `translateX(${v - 100}%)`
            setExibido(progresso >= 1 ? pct : Math.round(v))
        },
        aoConcluir: () => preenchimento.current?.classList.remove('pdco-barra-crescendo'),
    })

    return (
        <>
            <div className="pdco-plan-card-progress-row">
                <span>{rotulo}</span>
                <span className="pdco-plan-card-pct">{exibido}%</span>
            </div>
            <div className="pdco-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${pct}% das ações concluídas`}>
                <div
                    ref={preenchimento}
                    className="pdco-progress-bar-fill"
                    // Posição inicial só na montagem: depois é o laço de animação que move a barra.
                    style={{ backgroundColor: cor, transform: `translateX(${inicial - 100}%)` }}
                />
            </div>
        </>
    )
}

/** Esqueleto de lista/cards enquanto os planos carregam — blocos discretos com varredura de luz, sem spinner. */
export function EsqueletoLista({ linhas = 6, cards = false }) {
    return (
        <div className={cards ? 'pdco-card-grid' : 'pdco-row-list'} role="status" aria-label="Carregando planos">
            {Array.from({ length: linhas }, (_, i) => (
                <div className={`pdco-esq ${cards ? 'pdco-esq-card' : 'pdco-esq-linha'}`} key={i}>
                    <span className="pdco-esq-bloco" style={{ width: cards ? '38%' : 90 }} />
                    <span className="pdco-esq-bloco pdco-esq-titulo" style={{ width: cards ? '82%' : undefined }} />
                    <span className="pdco-esq-bloco pdco-esq-barra" style={{ width: cards ? '100%' : 160 }} />
                    {!cards && <span className="pdco-esq-bloco" style={{ width: 84, height: 22, borderRadius: 999 }} />}
                </div>
            ))}
        </div>
    )
}

/** Esqueleto do banner executivo (título + medidores) para a primeira carga da página. */
export function EsqueletoBanner() {
    return (
        <section className="pdco-panel pdco-banner pdco-esq-painel" role="status" aria-label="Carregando painel">
            <div className="pdco-esq-texto">
                <span className="pdco-esq-bloco" style={{ width: 240, height: 26 }} />
                <span className="pdco-esq-bloco" style={{ width: 360 }} />
            </div>
            <div className="pdco-esq-arcos">
                <span className="pdco-esq-bloco pdco-esq-arco" />
                <span className="pdco-esq-bloco pdco-esq-arco" />
            </div>
        </section>
    )
}
