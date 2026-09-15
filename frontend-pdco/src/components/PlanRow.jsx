import { Link } from 'react-router-dom'
import { RagBadge } from './RagBadge'
import { TipoChip } from './TipoChip'
import { calcRag, tituloDoPlano, RAG_COLOR } from '../lib/pdcoCalc'

// Linha de plano — variante compacta em lista (alternativa ao PlanCard).
export function PlanRow({ plano }) {
    const rag = calcRag(plano)
    const cor = RAG_COLOR[rag.nivel]
    const pct = plano.execucao === null ? 0 : Math.round(plano.execucao * 100)

    return (
        <Link to={`/plano/${encodeURIComponent(plano.cd_planoacao)}`} className="pdco-plan-row">
            <span className="pdco-plan-row-bar" style={{ backgroundColor: cor }} />
            <div className="pdco-plan-row-main">
                <span className="pdco-eyebrow">{plano.area_nome || 'Sem área'}</span>
                <TipoChip subtipo={plano.subtipo} />
            </div>
            <h3 className="pdco-plan-row-title">{tituloDoPlano(plano)}</h3>
            <div className="pdco-plan-row-progress">
                <div className="pdco-plan-card-progress-row">
                    <span>
                        {rag.concluidas}/{rag.total} ações
                    </span>
                    <span className="pdco-plan-card-pct">{pct}%</span>
                </div>
                <div className="pdco-progress-bar">
                    <div className="pdco-progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: cor }} />
                </div>
            </div>
            {rag.atrasadas > 0 && <span className="pdco-plan-row-atraso">{rag.atrasadas} atras.</span>}
            <RagBadge nivel={rag.nivel} score={rag.score} />
        </Link>
    )
}
