import { Link } from 'react-router-dom'
import { RagBadge } from './RagBadge'
import { TipoChip } from './TipoChip'
import { calcRag, tituloDoPlano, RAG_COLOR } from '../lib/pdcoCalc'

// Card de plano — usado nas listagens (Minha Área, Diretoria, Área).
export function PlanCard({ plano }) {
    const rag = calcRag(plano)
    const cor = RAG_COLOR[rag.nivel]
    const pct = plano.execucao === null ? 0 : Math.round(plano.execucao * 100)

    return (
        <Link to={`/plano/${encodeURIComponent(plano.cd_planoacao)}`} className="pdco-plan-card">
            <span className="pdco-plan-card-bar" style={{ backgroundColor: cor }} />
            <div className="pdco-plan-card-body">
                <div className="pdco-plan-card-head">
                    <div className="pdco-plan-card-meta">
                        <span className="pdco-eyebrow">{plano.area_nome || 'Sem área'}</span>
                        <TipoChip subtipo={plano.subtipo} />
                    </div>
                    <RagBadge nivel={rag.nivel} score={rag.score} />
                </div>

                <h3 className="pdco-plan-card-title">{tituloDoPlano(plano)}</h3>

                <div className="pdco-plan-card-progress">
                    <div className="pdco-plan-card-progress-row">
                        <span>
                            {rag.concluidas}/{rag.total} ações concluídas
                        </span>
                        <span className="pdco-plan-card-pct">{pct}%</span>
                    </div>
                    <div className="pdco-progress-bar">
                        <div className="pdco-progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: cor }} />
                    </div>
                </div>

                <div className="pdco-plan-card-foot">
                    <span className="pdco-plan-card-resp">{plano.responsavel || 'Sem responsável'}</span>
                    {rag.atrasadas > 0 && <span className="pdco-plan-card-atraso">{rag.atrasadas} atrasada(s)</span>}
                </div>
            </div>
        </Link>
    )
}
