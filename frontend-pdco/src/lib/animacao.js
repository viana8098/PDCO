// Animações numéricas do painel (arcos, contadores, barras) — sem biblioteca.
//
// Um único laço requestAnimationFrame atende TODAS as animações ativas (não há um
// timer por componente) e ele só roda enquanto houver algo animando. Cada
// animação vai de um valor a outro no tempo, com easing, e devolve o valor a cada
// quadro; quem chama decide o que fazer com ele (escrever num atributo SVG, num
// transform, num texto). Assim arco, número e barra de um mesmo indicador são
// movidos pela MESMA curva e terminam juntos.
//
// Valores finais nunca são inventados: toda animação parte de 0 (primeira entrada)
// ou do valor que já estava na tela e termina exatamente no valor recebido.
// Com prefers-reduced-motion, o valor final aparece direto, sem animar.

import { useLayoutEffect, useRef } from 'react'

export const movimentoReduzido = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

// --------------------------------------------------------------------------
// Sequência de entrada: a primeira tela da sessão toca a entrada completa
// (~1,8 s, em cascata); depois disso o painel passa para o modo "rápido", pra
// trocar de aba ou de filtro nunca parecer lento. O CSS lê o mesmo estado pelo
// atributo data-entrada do .pdco-app.
// --------------------------------------------------------------------------
const DURACAO_ENTRADA_COMPLETA_MS = 2400
const FATOR_MODO_RAPIDO = 0.4
let sessaoIniciada = false
let modoRapido = false

function iniciarSessao() {
    if (sessaoIniciada || typeof window === 'undefined') return
    sessaoIniciada = true
    window.setTimeout(() => {
        modoRapido = true
        document.querySelector('.pdco-app')?.setAttribute('data-entrada', 'rapida')
    }, DURACAO_ENTRADA_COMPLETA_MS)
}

/** 1 na entrada completa; menor que 1 depois dela (atrasos e durações encolhem). */
export const fatorEntrada = () => (modoRapido ? FATOR_MODO_RAPIDO : 1)

/**
 * Atraso (ms) do início da barra/contador do item `indice` de uma lista, acompanhando a
 * cascata de entrada das linhas (mesmos passos do CSS: --ent-lista + --i * --ent-passo).
 */
export const atrasoDoItem = (indice) => 520 + Math.min(indice, 11) * 36 + 140

/** Estilo que alimenta a cascata de entrada em CSS (o passo vem de --ent-passo). */
export const estiloCascata = (indice) => ({ '--i': Math.min(indice, 11) })

// --------------------------------------------------------------------------
// Agendador único
// --------------------------------------------------------------------------
const ativas = new Set()
let quadro = null

function tick(agora) {
    for (const t of [...ativas]) {
        if (agora < t.inicio) continue // ainda no atraso
        const progresso = Math.min(1, (agora - t.inicio) / t.duracao)
        t.aoQuadro(t.de + (t.para - t.de) * t.easing(progresso), progresso)
        if (progresso >= 1) {
            ativas.delete(t)
            t.aoConcluir?.()
        }
    }
    quadro = ativas.size ? requestAnimationFrame(tick) : null
}

/** Anima de `de` a `para`. Devolve a função que cancela. */
export function animar({ de, para, duracao, atraso = 0, easing = easeOutCubic, aoQuadro, aoConcluir }) {
    iniciarSessao()
    if (movimentoReduzido() || duracao <= 0) {
        aoQuadro(para, 1)
        aoConcluir?.()
        return () => {}
    }
    const t = { de, para, duracao, easing, aoQuadro, aoConcluir, inicio: performance.now() + atraso }
    ativas.add(t)
    if (quadro === null) quadro = requestAnimationFrame(tick)
    return () => ativas.delete(t)
}

/**
 * Anima um valor rumo a `alvo` sempre que ele muda.
 *  - Primeira entrada: de 0 até o alvo, com o atraso e a duração pedidos.
 *  - Depois (ex.: um filtro trouxe um valor novo): do valor que está na tela até o
 *    novo, mais curto. Se o alvo é o mesmo de antes, não faz nada (re-render não reinicia).
 * `aoQuadro(valor, progresso)` escreve o valor onde for preciso, sem re-renderizar o
 * componente a cada quadro; `aoIniciar`/`aoConcluir` marcam o começo e o fim.
 */
export function useValorAnimado(alvo, { duracao = 1000, atraso = 0, easing = easeOutCubic, aoIniciar, aoQuadro, aoConcluir } = {}) {
    // Valor atualmente exibido; null = nada foi desenhado ainda (primeira entrada).
    // (No StrictMode o efeito roda duas vezes: a 1ª execução é cancelada antes de qualquer
    // quadro, então a 2ª ainda se enxerga como primeira entrada.)
    const exibido = useRef(null)
    const funcoes = useRef({})
    funcoes.current = { aoIniciar, aoQuadro, aoConcluir }

    useLayoutEffect(() => {
        if (typeof alvo !== 'number' || Number.isNaN(alvo)) return undefined
        const primeira = exibido.current === null
        if (!primeira && exibido.current === alvo) return undefined

        funcoes.current.aoIniciar?.()
        const fator = fatorEntrada()
        return animar({
            de: primeira ? 0 : exibido.current,
            para: alvo,
            duracao: primeira ? duracao * fator : Math.max(320, duracao * 0.45),
            atraso: primeira ? atraso * fator : 0,
            easing,
            aoQuadro: (valor, progresso) => {
                exibido.current = valor
                funcoes.current.aoQuadro?.(valor, progresso)
            },
            aoConcluir: () => funcoes.current.aoConcluir?.(),
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alvo])
}
