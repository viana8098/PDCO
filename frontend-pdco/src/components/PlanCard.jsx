import { Link } from 'react-router-dom'
import { ProgressoAcoes } from './Animados'
import { RagBadge } from './RagBadge'
import { TipoChip } from './TipoChip'
import { estiloCascata } from '../lib/animacao'
import { calcRag, tituloDoPlano, RAG_COLOR } from '../lib/pdcoCalc'

// Card de plano — usado nas listagens (Minha Área, Diretoria, Área).
// `indice` posiciona o card na cascata de entrada (e na da sua barra de progresso).
export function PlanCard({ plano, indice = 0 }) {
    const rag = calcRag(plano)
    const cor = RAG_COLOR[rag.nivel]
    const pct = plano.execucao === null ? 0 : Math.round(plano.execucao * 100)

    return (
        <Link to={`/plano/${encodeURIComponent(plano.cd_planoacao)}`} className="pdco-plan-card" style={estiloCascata(indice)}>
            <span className="pdco-plan-card-bar" style={{ backgroundColor: cor }} />
            <div className="pdco-plan-card-body">
                <div className="pdco-plan-card-head">
                    <div className="pdco-plan-card-meta">
                        <span className="pdco-eyebrow">{plano.area_nome || 'Sem área'}</span>
                        <TipoChip subtipo={plano.subtipo} />
                    </div>
                    <RagBadge nivel={rag.nivel} score={rag.score} rag={rag} />
                </div>

                <h3 className="pdco-plan-card-title">{tituloDoPlano(plano)}</h3>

                <div className="pdco-plan-card-progress">
                    <ProgressoAcoes rotulo={`${rag.concluidas}/${rag.total} ações concluídas`} pct={pct} cor={cor} indice={indice} />
                </div>

                <div className="pdco-plan-card-foot">
                    <span className="pdco-plan-card-resp">{plano.responsavel || 'Sem responsável'}</span>
                    {rag.atrasadas > 0 && <span className="pdco-plan-card-atraso">{rag.atrasadas} atrasada(s)</span>}
                </div>
            </div>
        </Link>
    )
}
