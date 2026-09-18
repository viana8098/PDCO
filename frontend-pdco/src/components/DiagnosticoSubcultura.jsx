import { useState } from 'react'

/**
 * Diagnóstico da Subcultura — caixa recolhível, fechada por padrão. Sem
 * conteúdo, fica só o título (sem seta, sem abrir).
 */
export function DiagnosticoSubcultura({ texto }) {
    const [aberto, setAberto] = useState(false)
    const temTexto = !!(texto && texto.trim())

    return (
        <section className="pdco-panel">
            <button
                type="button"
                className="pdco-diagnostico-head"
                disabled={!temTexto}
                aria-expanded={temTexto ? aberto : undefined}
                onClick={() => setAberto((a) => !a)}
            >
                <span className="pdco-diagnostico-titulos">
                    <span className="pdco-kicker pdco-diagnostico-kicker">Leitura cultural</span>
                    <span className="pdco-panel-title">Diagnóstico da Subcultura</span>
                </span>
                {temTexto && <span className={`pdco-month-caret ${aberto ? 'pdco-month-caret-aberto' : ''}`}>▾</span>}
            </button>
            {temTexto && aberto && <p className="pdco-diagnostico-texto">{texto}</p>}
        </section>
    )
}
