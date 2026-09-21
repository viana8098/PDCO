import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * "i" discreto que abre um balão de informação ao passar o mouse (ou focar/tocar). O conteúdo do balão
 * vem em `children`; `rotulo` é o nome acessível do ícone; `estreito` usa um balão mais compacto
 * (avisos curtos). É a base do "i" do status (InfoStatus) e do "i" dos anexos.
 *
 * O balão é desenhado num portal com posição fixa: assim não é cortado pelos cards/painéis
 * (overflow: hidden) e o clique no "i" não aciona o link do card em que ele está. Fecha ao sair,
 * tocar fora, rolar, redimensionar ou apertar Esc.
 */
export function InfoTooltip({ rotulo, estreito = false, children }) {
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

    const alvo = aberto ? (iconeRef.current?.closest('.pdco-app') ?? document.body) : null

    return (
        <>
            <span
                ref={iconeRef}
                className="pdco-info"
                role="button"
                tabIndex={0}
                aria-label={rotulo}
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
                        className={`pdco-info-balao ${estreito ? 'pdco-info-balao-estreito' : ''}`}
                        style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
                    >
                        {children}
                    </div>,
                    alvo,
                )}
        </>
    )
}
