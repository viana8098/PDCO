import { useAsync } from '../lib/useAsync'
import { formatarData } from '../lib/pdcoCalc'
import { api } from '../lib/api'

/**
 * "Dados atualizados em <data>": o dia da última carga do dw por trás do snapshot que está no ar
 * (gravado em atualizacao.json por scripts/gerar-snapshot.mjs) — não o dia em que alguém abriu a página.
 * Discreto e sem estado de erro: se o arquivo não existir, o selo simplesmente não aparece.
 */
export function DataAtualizacao() {
    const atualizacao = useAsync(() => api.atualizacao(), [], true)
    const data = atualizacao.dados?.atualizado_em
    if (!data) return null

    return (
        <span className="pdco-atualizacao" title="Dia da última carga do DW corporativo (EPA) que alimenta este painel">
            <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="10" cy="10" r="7" />
                <path d="M10 6v4.2l2.8 1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dados atualizados em <b>{formatarData(data)}</b>
        </span>
    )
}
