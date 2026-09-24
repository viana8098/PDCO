import { useAsync } from '../lib/useAsync'
import { formatarData } from '../lib/pdcoCalc'
import { api } from '../lib/api'

/**
 * "Dados atualizados em <data> às <hora>": o `dt_carga` da tabela de planos de ação do EPA no dw no
 * momento em que o snapshot no ar foi gerado (gravado em atualizacao.json por scripts/gerar-snapshot.mjs)
 * — não o dia em que alguém abriu a página. Data e hora saem como estão no banco, sem conversão de fuso.
 * Discreto e sem estado de erro: se o arquivo não existir, o selo simplesmente não aparece.
 */
export function DataAtualizacao() {
    const atualizacao = useAsync(() => api.atualizacao(), [], true)
    const carga = atualizacao.dados?.atualizado_em
    if (!carga) return null
    // "2026-09-24T03:09:14" -> dia "2026-09-24", hora "03:09:14" (sem "T" = só a data, sem hora).
    const [dia, hora] = carga.split('T')

    return (
        <span className="pdco-atualizacao" title="Última carga (dt_carga) da tabela de planos de ação do EPA no DW corporativo, quando este snapshot foi gerado">
            <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="10" cy="10" r="7" />
                <path d="M10 6v4.2l2.8 1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dados atualizados em{' '}
            <b>
                {formatarData(dia)}
                {hora ? ` às ${hora.slice(0, 5)}` : ''}
            </b>
        </span>
    )
}
