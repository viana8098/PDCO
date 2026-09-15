import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { StatusPill } from '../components/StatusPill'
import { formatarData } from '../lib/pdcoCalc'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

export default function AcaoDetail() {
    const { user } = usePdco()
    const { cdPlanoAcao, cdAcao } = useParams()
    const detalhe = useAsync(() => api.plano(user, cdPlanoAcao), [user, cdPlanoAcao], !!user && !!cdPlanoAcao)

    if (detalhe.erro) return <div className="pdco-page pdco-estado pdco-erro">{detalhe.erro}</div>
    if (!detalhe.dados) return <div className="pdco-page pdco-estado">Carregando ação…</div>

    const { plano, acoes, acompanhamento } = detalhe.dados
    const acao = acoes.find((a) => String(a.cd_acao) === String(cdAcao))

    if (!acao) {
        return (
            <div className="pdco-page">
                <p className="pdco-estado">Ação não encontrada ou você não tem acesso.</p>
                <Link to={`/plano/${encodeURIComponent(cdPlanoAcao)}`} className="pdco-voltar">
                    ← Voltar ao plano
                </Link>
            </div>
        )
    }

    const acompanhamentosDaAcao = acompanhamento
        .flatMap((q) => q.registros.map((r) => ({ ...r, mes: q.mes })))
        .filter((r) => r.origem === 'acao')

    return (
        <div className="pdco-page">
            <Link to={`/plano/${encodeURIComponent(cdPlanoAcao)}`} className="pdco-voltar">
                ← Voltar ao plano
            </Link>

            <section className="pdco-panel pdco-detail-head">
                <div className="pdco-detail-head-top">
                    <div className="pdco-detail-head-info">
                        <span className="pdco-eyebrow">{plano.area_nome || 'Sem área'}</span>
                        <h1 className="pdco-detail-title">{acao.nome}</h1>
                        <p className="pdco-detail-meta-row">
                            Pertence ao plano:{' '}
                            <Link to={`/plano/${encodeURIComponent(cdPlanoAcao)}`} className="pdco-inline-link">
                                {plano.arquetipos_culturais ? plano.arquetipos_culturais.slice(0, 60) : `Plano ${plano.cd_planoacao}`}
                            </Link>
                        </p>
                    </div>
                    <StatusPill status={acao.status} />
                </div>

                <div className="pdco-mini-stat-grid pdco-mini-stat-grid-3">
                    <MiniStat label="Responsável" valor={acao.responsavel || '—'} />
                    <MiniStat label="Prazo inicial" valor={formatarData(acao.prazo_inicial)} />
                    <MiniStat label="Prazo final" valor={formatarData(acao.prazo_final)} />
                </div>
            </section>

            <section className="pdco-panel">
                <div className="pdco-panel-header">
                    <h2 className="pdco-panel-title">Acompanhamentos da ação ({acompanhamentosDaAcao.length})</h2>
                </div>
                <div className="pdco-acomp-list">
                    {acompanhamentosDaAcao.length === 0 && <p className="pdco-vazio">Nenhum acompanhamento registrado para esta ação.</p>}
                    {acompanhamentosDaAcao.map((r, indice) => (
                        <div className="pdco-acomp-item" key={indice}>
                            <p>{r.texto}</p>
                            <p className="pdco-acomp-item-data">
                                Mês {r.mes} · {formatarData(r.data)}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

function MiniStat({ label, valor }) {
    return (
        <div className="pdco-mini-stat">
            <p className="pdco-mini-stat-label">{label}</p>
            <p className="pdco-mini-stat-valor">{valor}</p>
        </div>
    )
}
