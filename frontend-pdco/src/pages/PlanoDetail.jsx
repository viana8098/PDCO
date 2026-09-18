import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { AcoesTable } from '../components/AcoesTable'
import { AcompanhamentoGrid } from '../components/AcompanhamentoGrid'
import { AnexosTab } from '../components/AnexosTab'
import { CaixaRecolhivel } from '../components/CaixaRecolhivel'
import { IndicadoresCard } from '../components/IndicadoresCard'
import { PlanoTimeline } from '../components/PlanoTimeline'
import { RagBadge } from '../components/RagBadge'
import { TipoChip } from '../components/TipoChip'
import { calcRag, formatarData, tituloDoPlano, RAG_COLOR, RAG_LABEL } from '../lib/pdcoCalc'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

export default function PlanoDetail() {
    const { user } = usePdco()
    const { cdPlanoAcao } = useParams()
    const detalhe = useAsync(() => api.plano(user, cdPlanoAcao), [user, cdPlanoAcao], !!user && !!cdPlanoAcao)
    const [aba, setAba] = useState('acoes')
    // Mês escolhido na previsão de conclusão (chave ano*12+mês): filtra a tabela
    // da aba "Ações do plano" e destaca as atrasadas daquele período.
    const [mesSelecionado, setMesSelecionado] = useState(null)
    useEffect(() => {
        setAba('acoes')
        setMesSelecionado(null)
    }, [cdPlanoAcao])

    function selecionarMes(chave) {
        setMesSelecionado(chave)
        if (chave !== null) setAba('acoes')
    }

    if (detalhe.erro) {
        return (
            <div className="pdco-page">
                <p className="pdco-estado pdco-erro">{detalhe.erro}</p>
                <Link to="/" className="pdco-voltar">
                    ← Voltar
                </Link>
            </div>
        )
    }
    if (!detalhe.dados) return <div className="pdco-page pdco-estado">Carregando plano…</div>

    const { plano, acoes, acompanhamento, indicadores } = detalhe.dados
    const rag = calcRag(plano, acompanhamento)
    const cor = RAG_COLOR[rag.nivel]
    const totalAcompanhamentos = acompanhamento.reduce((s, q) => s + q.registros.length, 0)

    const abas = [
        { chave: 'acoes', rotulo: 'Ações do plano', total: acoes.length },
        { chave: 'acompanhamentos', rotulo: 'Acompanhamentos do plano', total: totalAcompanhamentos },
        { chave: 'anexos', rotulo: 'Anexos de evidência', total: 0 },
    ]

    return (
        <div className="pdco-page">
            <Link to="/" className="pdco-voltar">
                ← Voltar
            </Link>

            <section className="pdco-panel pdco-detail-head">
                <div className="pdco-detail-head-top">
                    <div className="pdco-detail-head-info">
                        <div className="pdco-plan-card-meta">
                            <span className="pdco-eyebrow">{plano.area_nome || 'Sem área'}</span>
                            <TipoChip subtipo={plano.subtipo} />
                        </div>
                        <h1 className="pdco-detail-title">{tituloDoPlano(plano)}</h1>
                        <div className="pdco-detail-meta-row">
                            {plano.data_inicio && <span>Início: {formatarData(plano.data_inicio)}</span>}
                            {plano.data_fim && <span>Fim: {formatarData(plano.data_fim)}</span>}
                            <span>Responsável: {plano.responsavel || '—'}</span>
                        </div>
                    </div>
                    <RagBadge nivel={rag.nivel} score={rag.score} size="md" />
                </div>

                <div className="pdco-detail-grid">
                    <div className="pdco-rag-info" style={{ borderColor: `${cor}55`, backgroundColor: `${cor}1a` }}>
                        <p className="pdco-rag-info-title" style={{ color: cor }} title={rag.motivos.join(' · ')}>
                            Status automático: {RAG_LABEL[rag.nivel]} · score {rag.score}/100
                        </p>
                        <div className="pdco-mini-stat-grid">
                            <MiniStat label="Concluídas" valor={`${rag.concluidas}/${rag.total}`} />
                            <MiniStat label="Atrasadas" valor={rag.atrasadas} perigo={rag.atrasadas > 0} />
                            <MiniStat label="Execução" valor={plano.execucao === null ? '—' : `${Math.round(plano.execucao * 100)}%`} />
                            <MiniStat label="Acompanh." valor={totalAcompanhamentos} />
                        </div>
                        <p className="pdco-rag-motivos">{rag.motivos.join(' · ')}</p>
                    </div>
                    <PlanoTimeline key={cdPlanoAcao} acoes={acoes} mesSelecionado={mesSelecionado} onSelecionarMes={selecionarMes} />
                </div>
            </section>

            <div className="pdco-secondary-row">
                <CaixaRecolhivel titulo="Diagnóstico da Subcultura" texto={null} preservarQuebras />
                <CaixaRecolhivel titulo="Resultados esperados" texto={plano.resultados_esperados} />
            </div>

            <section className="pdco-panel">
                <div className="pdco-plan-tabs">
                    {abas.map((a) => (
                        <button
                            type="button"
                            key={a.chave}
                            className={`pdco-plan-tab ${aba === a.chave ? 'pdco-plan-tab-ativa' : ''}`}
                            onClick={() => setAba(a.chave)}
                        >
                            {a.rotulo} ({a.total})
                        </button>
                    ))}
                </div>

                <div className="pdco-plan-tab-body">
                    {aba === 'acoes' && <AcoesTable acoes={acoes} mesFiltro={mesSelecionado} onLimparFiltro={() => setMesSelecionado(null)} />}
                    {aba === 'acompanhamentos' && <AcompanhamentoGrid quadrantes={acompanhamento} plano={plano} />}
                    {aba === 'anexos' && <AnexosTab />}
                </div>
            </section>

            {indicadores.length > 0 && (
                <div className="pdco-tertiary-row pdco-tertiary-single">
                    <IndicadoresCard indicadores={indicadores} />
                </div>
            )}
        </div>
    )
}

function MiniStat({ label, valor, perigo }) {
    return (
        <div className={`pdco-mini-stat ${perigo ? 'pdco-mini-stat-perigo' : ''}`}>
            <p className="pdco-mini-stat-label">{label}</p>
            <p className="pdco-mini-stat-valor">{valor}</p>
        </div>
    )
}
