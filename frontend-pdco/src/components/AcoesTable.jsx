import { Link, useParams } from 'react-router-dom'
import { iniciaisDoNome } from '../lib/iniciais'
import { formatarData } from '../lib/pdcoCalc'
import { StatusPill } from './StatusPill'

// Painel "Ações do plano": tabela de detalhamento — nome, status, prazos e
// responsável (com avatar de iniciais). Cada linha leva ao detalhe da ação.
export function AcoesTable({ acoes }) {
    const { cdPlanoAcao } = useParams()

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
                            <th>Ação</th>
                            <th>Status</th>
                            <th>Prazo inicial</th>
                            <th>Prazo final</th>
                            <th>Responsável</th>
                        </tr>
                    </thead>
                    <tbody>
                        {acoes.map((acao) => (
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
