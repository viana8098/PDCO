import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { acaoAtrasada, acaoCancelada, acaoConcluida, chaveDoMes, rotuloDaChave } from '../lib/pdcoCalc'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Rolagem automática pelas pontas: zona de ativação (px) e velocidade máxima (px/quadro).
const ZONA_BORDA = 64
const VELOCIDADE_MAX = 12
const LIMITE_ARRASTO = 5

const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor))

// Previsão de conclusão por mês (calendário), a partir do prazo final de
// cada ação — independente da janela de 8 meses relativa ao início do plano
// (essa é a janela de acompanhamento, ver AcompanhamentoGrid). A janela vai
// do primeiro ao último mês que realmente tem ação com prazo — não usa as
// datas de início/fim do plano, que costumam ser mais largas que os prazos
// reais e deixavam meses vazios sobrando nas pontas.
//
// Cada mês é um filtro: clicar seleciona o mês (`mesSelecionado`, chave de
// ano*12+mês) e a tabela de ações abaixo passa a mostrar só aquele período.
export function PlanoTimeline({ acoes, mesSelecionado, onSelecionarMes }) {
    const viewportRef = useRef(null)
    const scrollerRef = useRef(null)
    const reduzMovimento = useRef(false)
    // Estado do "motor" de rolagem — vive em ref pra não re-renderizar a cada quadro.
    const motor = useRef({ pos: 0, vel: 0, alvoVel: 0, alvoPos: null, raf: 0, inicioArrasto: null, arrastando: false, arrastou: false })
    const [bordas, setBordas] = useState({ esq: false, dir: false })

    const hoje = new Date()
    const chaveHoje = hoje.getFullYear() * 12 + hoje.getMonth()

    const baldes = new Map()
    for (const acao of acoes) {
        // Cancelada não entra em lugar nenhum dessa conta — mesmo critério do
        // resumo do back-end (calcularResumoAcoes): não é atraso nem pendência.
        if (acaoCancelada(acao)) continue
        const chave = chaveDoMes(acao.prazo_final)
        if (chave === null) continue
        if (!baldes.has(chave)) baldes.set(chave, { total: 0, concluidas: 0, atrasadas: 0 })
        const balde = baldes.get(chave)
        balde.total++
        if (acaoConcluida(acao)) balde.concluidas++
        else if (acaoAtrasada(acao, hoje)) balde.atrasadas++
    }

    const temDados = baldes.size > 0
    const chavesComDados = [...baldes.keys()]
    const inicio = temDados ? Math.min(...chavesComDados) : 0
    const fim = temDados ? Math.max(...chavesComDados) : 0

    const atualizarBordas = useCallback(() => {
        const el = scrollerRef.current
        if (!el) return
        const esq = el.scrollLeft > 2
        const dir = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
        setBordas((b) => (b.esq === esq && b.dir === dir ? b : { esq, dir }))
    }, [])

    // Um quadro do motor: aplica a velocidade das pontas (acelera devagar, freia
    // rápido) e a rolagem suave da roda do mouse, sempre por interpolação.
    const passo = useCallback(() => {
        const el = scrollerRef.current
        const m = motor.current
        if (!el) {
            m.raf = 0
            return
        }
        const max = el.scrollWidth - el.clientWidth
        let ativo = false

        m.vel += (m.alvoVel - m.vel) * (Math.abs(m.alvoVel) > Math.abs(m.vel) ? 0.1 : 0.4)
        if (m.alvoVel === 0 && Math.abs(m.vel) < 0.08) m.vel = 0
        if ((m.pos <= 0 && m.vel < 0) || (m.pos >= max && m.vel > 0)) m.vel = 0
        if (m.vel !== 0) {
            m.pos += m.vel
            ativo = true
        }

        if (m.alvoPos !== null) {
            const distancia = m.alvoPos - m.pos
            if (Math.abs(distancia) < 0.5) {
                m.pos = m.alvoPos
                m.alvoPos = null
            } else {
                m.pos += distancia * 0.22
                ativo = true
            }
        }

        m.pos = limitar(m.pos, 0, max)
        el.scrollLeft = m.pos
        m.raf = ativo ? requestAnimationFrame(passo) : 0
    }, [])

    const acordar = useCallback(() => {
        const m = motor.current
        if (m.raf) return
        if (scrollerRef.current) m.pos = scrollerRef.current.scrollLeft
        m.raf = requestAnimationFrame(passo)
    }, [passo])

    // Ao abrir, centraliza o mês atual (ou o mês mais próximo, se hoje está fora da janela).
    useLayoutEffect(() => {
        const el = scrollerRef.current
        if (!el || !temDados) return
        const alvo = limitar(chaveHoje, inicio, fim)
        const celula = el.querySelector(`[data-chave="${alvo}"]`)
        if (celula) el.scrollLeft = celula.offsetLeft - (el.clientWidth - celula.offsetWidth) / 2
        motor.current.pos = el.scrollLeft
        atualizarBordas()
    }, [temDados, inicio, fim, chaveHoje, atualizarBordas])

    useEffect(() => {
        reduzMovimento.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
        return () => cancelAnimationFrame(motor.current.raf)
    }, [])

    useEffect(() => {
        const el = scrollerRef.current
        if (!el || typeof ResizeObserver === 'undefined') return
        const observador = new ResizeObserver(atualizarBordas)
        observador.observe(el)
        return () => observador.disconnect()
    }, [temDados, atualizarBordas])

    // Roda do mouse sobre a timeline rola na horizontal. Precisa ser listener
    // nativo não-passivo pra poder cancelar a rolagem da página; quando a
    // timeline já está na ponta daquele lado, deixa a página rolar normalmente.
    // Gesto horizontal do touchpad já é tratado pelo navegador.
    useEffect(() => {
        const el = scrollerRef.current
        if (!el) return
        function aoRolar(e) {
            if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
            const max = el.scrollWidth - el.clientWidth
            if (max <= 0) return
            const delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY
            if ((delta < 0 && el.scrollLeft <= 0) || (delta > 0 && el.scrollLeft >= max - 1)) return
            e.preventDefault()
            const m = motor.current
            const base = m.alvoPos !== null ? m.alvoPos : el.scrollLeft
            m.alvoPos = limitar(base + delta, 0, max)
            acordar()
        }
        el.addEventListener('wheel', aoRolar, { passive: false })
        return () => el.removeEventListener('wheel', aoRolar)
    }, [temDados, acordar])

    function aoRolarScroller() {
        const m = motor.current
        if (!m.raf && scrollerRef.current) m.pos = scrollerRef.current.scrollLeft
        atualizarBordas()
    }

    // Perto das pontas (só com mouse), a timeline desliza sozinha; quanto mais
    // perto da borda, mais rápido. No centro não rola.
    function aoMoverNoViewport(e) {
        const m = motor.current
        const el = scrollerRef.current
        if (e.pointerType !== 'mouse' || m.arrastando || reduzMovimento.current || !el) return
        const retangulo = viewportRef.current.getBoundingClientRect()
        const zona = Math.min(ZONA_BORDA, retangulo.width * 0.2)
        const x = e.clientX - retangulo.left
        const max = el.scrollWidth - el.clientWidth
        let alvo = 0
        if (x < zona && el.scrollLeft > 0) alvo = -VELOCIDADE_MAX * ((zona - x) / zona) ** 2
        else if (x > retangulo.width - zona && el.scrollLeft < max - 1) alvo = VELOCIDADE_MAX * ((x - (retangulo.width - zona)) / zona) ** 2
        if (alvo !== m.alvoVel) {
            m.alvoVel = alvo
            acordar()
        }
    }

    function aoSairDoViewport() {
        motor.current.alvoVel = 0
        acordar()
    }

    // Arrastar com o mouse. O toque já rola nativamente. Só vira "arrasto" depois
    // de alguns pixels, pra o clique nos meses continuar funcionando.
    function aoPressionar(e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return
        const m = motor.current
        m.inicioArrasto = { x: e.clientX, scroll: scrollerRef.current.scrollLeft, id: e.pointerId }
        m.arrastou = false
    }

    function aoArrastar(e) {
        const m = motor.current
        const el = scrollerRef.current
        if (!m.inicioArrasto) return
        if (e.buttons === 0) {
            m.inicioArrasto = null
            return
        }
        const deslocamento = e.clientX - m.inicioArrasto.x
        if (!m.arrastando) {
            if (Math.abs(deslocamento) < LIMITE_ARRASTO) return
            m.arrastando = true
            m.alvoVel = 0
            try {
                el.setPointerCapture(m.inicioArrasto.id)
            } catch {
                /* ponteiro já liberado: o arrasto segue sem captura */
            }
            el.classList.add('pdco-timeline-arrastando')
        }
        m.vel = 0
        m.alvoPos = null
        m.pos = limitar(m.inicioArrasto.scroll - deslocamento, 0, el.scrollWidth - el.clientWidth)
        el.scrollLeft = m.pos
    }

    function aoSoltar() {
        const m = motor.current
        const el = scrollerRef.current
        if (m.arrastando && el) {
            m.arrastou = true
            m.arrastando = false
            el.classList.remove('pdco-timeline-arrastando')
            try {
                el.releasePointerCapture(m.inicioArrasto.id)
            } catch {
                /* captura já liberada */
            }
            setTimeout(() => {
                m.arrastou = false
            }, 50)
        }
        m.inicioArrasto = null
    }

    // Depois de um arrasto, o clique que o navegador dispara não deve selecionar um mês.
    function aoClicarCaptura(e) {
        if (motor.current.arrastou) {
            e.preventDefault()
            e.stopPropagation()
            motor.current.arrastou = false
        }
    }

    if (!temDados) return null

    const totalAtrasadas = [...baldes.values()].reduce((s, b) => s + b.atrasadas, 0)

    const itens = []
    for (let chave = inicio; chave <= fim; chave++) {
        // Virada de ano: divisória discreta com o número do ano novo, sem virar card.
        if (chave > inicio && chave % 12 === 0) {
            itens.push(
                <div key={`ano-${chave}`} className="pdco-timeline-ano" aria-hidden="true">
                    <span className="pdco-timeline-ano-num">{chave / 12}</span>
                    <span className="pdco-timeline-ano-linha" />
                </div>,
            )
        }

        const balde = baldes.get(chave) || { total: 0, concluidas: 0, atrasadas: 0 }
        let tom = 'muted'
        if (balde.total > 0) {
            if (balde.atrasadas > 0) tom = 'danger'
            else if (balde.concluidas === balde.total) tom = 'success'
            else tom = 'info'
        }
        const selecionado = chave === mesSelecionado
        const resumo = balde.total
            ? `${rotuloDaChave(chave)}: ${balde.total} ação(ões)${balde.atrasadas ? ` · ${balde.atrasadas} atrasada(s)` : ''}`
            : `${rotuloDaChave(chave)}: nenhuma ação com prazo`

        itens.push(
            <button
                type="button"
                key={chave}
                data-chave={chave}
                className={`pdco-timeline-cell pdco-timeline-${tom} pdco-timeline-clicavel ${selecionado ? 'pdco-timeline-selecionado' : ''}`}
                aria-pressed={selecionado}
                title={resumo}
                aria-label={resumo}
                onClick={() => onSelecionarMes?.(selecionado ? null : chave)}
            >
                {chave === chaveHoje && <span className="pdco-timeline-atual" title="Mês atual" />}
                <span className="pdco-timeline-mes">{MESES[((chave % 12) + 12) % 12]}</span>
                <span className="pdco-timeline-total">{balde.total > 0 ? balde.total : '–'}</span>
            </button>,
        )
    }

    return (
        <section className="pdco-panel pdco-timeline-card">
            <div className="pdco-timeline-head">
                <span className="pdco-kicker">Previsão de conclusão por mês</span>
                {totalAtrasadas > 0 && <span className="pdco-timeline-alerta">{totalAtrasadas} atrasada(s)</span>}
            </div>
            <div className="pdco-timeline-viewport" ref={viewportRef} onPointerMove={aoMoverNoViewport} onPointerLeave={aoSairDoViewport}>
                <div
                    className="pdco-timeline-scroll"
                    ref={scrollerRef}
                    onScroll={aoRolarScroller}
                    onPointerDown={aoPressionar}
                    onPointerMove={aoArrastar}
                    onPointerUp={aoSoltar}
                    onPointerCancel={aoSoltar}
                    onClickCapture={aoClicarCaptura}
                >
                    {itens}
                </div>
                <span className={`pdco-timeline-borda pdco-timeline-borda-esq ${bordas.esq ? 'pdco-timeline-borda-ativa' : ''}`} aria-hidden="true">
                    ‹
                </span>
                <span className={`pdco-timeline-borda pdco-timeline-borda-dir ${bordas.dir ? 'pdco-timeline-borda-ativa' : ''}`} aria-hidden="true">
                    ›
                </span>
            </div>
        </section>
    )
}
