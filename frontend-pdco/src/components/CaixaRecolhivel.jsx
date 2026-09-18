import { useState } from 'react'

/**
 * Caixa recolhível de texto (Diagnóstico da Subcultura, Resultados esperados):
 * fechada por padrão, abre ao clicar. Sem conteúdo, fica só o título (sem
 * seta, sem abrir). `preservarQuebras` mantém as quebras de linha do texto.
 */
export function CaixaRecolhivel({ titulo, texto, preservarQuebras = false }) {
    const [aberta, setAberta] = useState(false)
    const temTexto = !!(texto && texto.trim())

    return (
        <section className="pdco-panel">
            <button
                type="button"
                className="pdco-recolhivel-head"
                disabled={!temTexto}
                aria-expanded={temTexto ? aberta : undefined}
                onClick={() => setAberta((a) => !a)}
            >
                <span className="pdco-panel-title">{titulo}</span>
                {temTexto && <span className={`pdco-month-caret ${aberta ? 'pdco-month-caret-aberto' : ''}`}>▾</span>}
            </button>
            {temTexto && aberta && (
                <p className={`pdco-recolhivel-texto ${preservarQuebras ? 'pdco-recolhivel-quebras' : ''}`}>{texto}</p>
            )}
        </section>
    )
}
