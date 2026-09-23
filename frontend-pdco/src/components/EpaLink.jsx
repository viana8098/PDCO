const EPA_URL = 'https://sistemafiea.sysepa.com.br/epa/incluir_plano_acao.php?codigo='

/**
 * Ícone discreto que abre o plano de ação no portal EPA (sistema legado), numa aba nova.
 * `cd_planoacao` é o mesmo código que o EPA usa na URL (confirmado no de-para já feito
 * pra Cesta do Gestor, `cesta-gestor/pages/Estrategia.jsx`, no app corporativo). Não é
 * um <a>: os cards/linhas de plano já são um Link inteiro clicável, e um <a> aninhado
 * dentro de outro atropela o clique — span com role="link" evita isso (mesmo motivo do
 * "i" em InfoTooltip).
 */
export function EpaLink({ codigo }) {
    if (!codigo) return null
    const href = `${EPA_URL}${encodeURIComponent(codigo)}`

    const abrir = (e) => {
        e.preventDefault()
        e.stopPropagation()
        window.open(href, '_blank', 'noopener,noreferrer')
    }

    return (
        <span
            className="pdco-epa-link"
            role="link"
            tabIndex={0}
            aria-label="Abrir Plano de Ação no EPA"
            title="Abrir Plano de Ação no EPA"
            onClick={abrir}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') abrir(e)
            }}
        >
            <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M8 5H4v11h11v-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 4h5v5M9 11l7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    )
}
