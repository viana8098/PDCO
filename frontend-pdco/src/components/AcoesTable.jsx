import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { iniciaisDoNome } from '../lib/iniciais'
import { formatarData } from '../lib/pdcoCalc'
import { StatusPill } from './StatusPill'

const COLUNAS = [
    { chave: 'nome', rotulo: 'Ação' },
    { chave: 'status', rotulo: 'Status' },
    { chave: 'prazo_inicial', rotulo: 'Prazo inicial' },
    { chave: 'prazo_final', rotulo: 'Prazo final' },
    { chave: 'responsavel', rotulo: 'Responsável' },
]

// Compara duas ações por uma coluna — string ou data ISO (yyyy-mm-dd), sem
// distinguir maiúsculas/minúsculas; valores vazios sempre vão pro final,
// não importa a direção.
function comparar(a, b, coluna) {
    const va = a[coluna]
    const vb = b[coluna]
    if (!va && !vb) return 0
    if (!va) return 1
    if (!vb) return -1
    return String(va).localeCompare(String(vb), 'pt-BR', { sensitivity: 'base', numeric: true })
}

export function AcoesTable({ acoes }) {
    const { cdPlanoAcao } = useParams()
    // null = ordem original (como veio da API); senão { coluna, direcao: 1 | -1 }
    const [ordenacao, setOrdenacao] = useState(null)

    function alternarOrdenacao(coluna) {
        setOrdenacao((atual) => {
            if (!atual || atual.coluna !== coluna) return { coluna, direcao: 1 }
            if (atual.direcao === 1) return { coluna, direcao: -1 }
            return null
        })
    }

    const acoesOrdenadas = useMemo(() => {
        if (!ordenacao) return acoes
        const { coluna, direcao } = ordenacao
        return [...acoes].sort((a, b) => direcao * comparar(a, b, coluna))
    }, [acoes, ordenacao])

    return (
        <section className="pdco-panel pdco-actions-panel">
            <div className="pdco-panel-header">
                <p className="pdco-kicker">Detalhamento operacional</p>
                <h2 className="pdco-panel-title">Ações do plano</h2>
                <p className="pdco-panel-subtitle">
                    {acoes.filter((a) => (a.status || '').toLowerCase().startsWith('conclu')).length} de {acoes.length} ações
                </p>
            </div>

            {acoes.length ? (
                <table className="pdco-tabela-acoes">
                    <thead>
                        <tr>
                            {COLUNAS.map((col) => {
                                const ativa = ordenacao?.coluna === col.chave
                                return (
                                    <th key={col.chave}>
                                        <button
                                            type="button"
                                            className={`pdco-th-ordenavel ${ativa ? 'pdco-th-ativa' : ''}`}
                                            onClick={() => alternarOrdenacao(col.chave)}
                                            title="Ordenar"
                                        >
                                            {col.rotulo}
                                            <span className="pdco-th-seta">{ativa ? (ordenacao.direcao === 1 ? '▲' : '▼') : '↕'}</span>
                                        </button>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {acoesOrdenadas.map((acao) => (
                            <tr key={acao.cd_acao}>
                                <td>
                                    <Link
                                        className="pdco-acao-link"
                                        to={`/plano/${encodeURIComponent(cdPlanoAcao)}/acao/${encodeURIComponent(acao.cd_acao)}`}
                                    >
                                        {acao.nome || '-'}
                                    </Link>
                                </td>
                                <td>
                                    <StatusPill status={acao.status} />
                                </td>
                                <td>{formatarData(acao.prazo_inicial)}</td>
                                <td>{formatarData(acao.prazo_final)}</td>
                                <td>
                                    {acao.responsavel ? (
                                        <span className="pdco-responsavel-cell">
                                            <span className="pdco-avatar">{iniciaisDoNome(acao.responsavel)}</span>
                                            {acao.responsavel}
                                        </span>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="pdco-vazio">Nenhuma ação cadastrada para este plano.</p>
            )}
        </section>
    )
}
