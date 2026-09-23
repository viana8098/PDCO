import { useState } from 'react'

/**
 * Caixa recolhível (Diagnóstico da Subcultura/da Cultura Organizacional,
 * Resultados esperados): fechada por padrão, abre ao clicar. Sem conteúdo,
 * fica só o título (sem seta, sem abrir). Aceita texto simples (`texto`,
 * com `preservarQuebras` mantendo as quebras de linha) ou conteúdo rico
 * (`children`, ex.: o gráfico de pizza do diagnóstico cultural) — um ou
 * outro, nunca os dois.
 */
export function CaixaRecolhivel({ titulo, texto, children, preservarQuebras = false }) {
    const [aberta, setAberta] = useState(false)
    const temConteudo = children != null ? true : !!(texto && texto.trim())

    return (
        <section className="pdco-panel">
            <button
                type="button"
                className="pdco-recolhivel-head"
                disabled={!temConteudo}
                aria-expanded={temConteudo ? aberta : undefined}
                onClick={() => setAberta((a) => !a)}
            >
                <span className="pdco-panel-title">{titulo}</span>
                {temConteudo && <span className={`pdco-month-caret ${aberta ? 'pdco-month-caret-aberto' : ''}`}>▾</span>}
            </button>
            {temConteudo &&
                aberta &&
                (children != null ? (
                    <div className="pdco-recolhivel-conteudo">{children}</div>
                ) : (
                    <p className={`pdco-recolhivel-texto ${preservarQuebras ? 'pdco-recolhivel-quebras' : ''}`}>{texto}</p>
                ))}
        </section>
    )
}
