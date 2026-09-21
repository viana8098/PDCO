import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { TabelaAcompanhamentos } from '../components/AcompanhamentoGrid'
import { StatusPill } from '../components/StatusPill'
import { formatarData, indiceMesRelativo } from '../lib/pdcoCalc'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

export default function AcaoDetail() {
    const { user } = usePdco()
    const { cdPlanoAcao, cdAcao } = useParams()
    const detalhe = useAsync(() => api.plano(user, cdPlanoAcao), [user, cdPlanoAcao], !!user && !!cdPlanoAcao)

    if (detalhe.erro) return <div className="pdco-page pdco-estado pdco-erro">{detalhe.erro}</div>
    if (!detalhe.dados) return <div className="pdco-page pdco-estado">Carregando ação…</div>

    const { plano, acoes, acompanhamento, registros_acompanhamento } = detalhe.dados
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

    // Acompanhamentos DESTA ação (ds_acompanhamentoacao). A lista completa do plano (`registros_acompanhamento`)
    // traz o código da ação de cada registro, então dá pra filtrar de verdade. Só com uma API antiga, sem essa
    // lista, cai na janela de 8 meses — que não tem o código — e mostra os das ações do plano todo.
    const mesDoPlano = (data) => {
        const i = indiceMesRelativo(plano.data_inicio, data)
        return i === null || i < 0 ? null : i + 1
    }
    const acompanhamentosDaAcao = registros_acompanhamento
        ? registros_acompanhamento
              .filter((r) => r.origem === 'acao' && String(r.cd_acao) === String(cdAcao))
              .map((r) => ({ ...r, mes: mesDoPlano(r.data), responsavel: acao.responsavel }))
        : acompanhamento
              .flatMap((q) => q.registros.map((r) => ({ ...r, mes: q.mes, responsavel: acao.responsavel })))
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

                <div className="pdco-acao-descricao">
                    <p className="pdco-mini-stat-label">Descrição da ação</p>
                    <p className={`pdco-acao-descricao-texto ${acao.descricao ? '' : 'pdco-acao-descricao-vazia'}`}>
                        {acao.descricao || 'Sem descrição cadastrada.'}
                    </p>
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
                <TabelaAcompanhamentos registros={acompanhamentosDaAcao} vazio="Nenhum acompanhamento registrado para esta ação." />
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
