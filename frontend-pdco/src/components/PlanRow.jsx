import { Link } from 'react-router-dom'
import { ProgressoAcoes } from './Animados'
import { EpaLink } from './EpaLink'
import { RagBadge } from './RagBadge'
import { TipoChip } from './TipoChip'
import { estiloCascata } from '../lib/animacao'
import { calcRag, tituloDoPlano, RAG_COLOR } from '../lib/pdcoCalc'

// Linha de plano — variante compacta em lista (alternativa ao PlanCard).
// `indice` posiciona a linha na cascata de entrada (e na da sua barra de progresso).
// `mostrarTipo` some numa lista que já é só de um tipo só (ex.: Minha Área, só Tático) — o chip vira ruído repetido.
export function PlanRow({ plano, indice = 0, mostrarTipo = true }) {
    const rag = calcRag(plano)
    const cor = RAG_COLOR[rag.nivel]
    const pct = plano.execucao === null ? 0 : Math.round(plano.execucao * 100)

    return (
        <Link to={`/plano/${encodeURIComponent(plano.cd_planoacao)}`} className="pdco-plan-row" style={estiloCascata(indice)}>
            <span className="pdco-plan-row-bar" style={{ backgroundColor: cor }} />
            <div className="pdco-plan-row-main">
                <span className="pdco-eyebrow">{plano.area_nome || 'Sem área'}</span>
                {mostrarTipo && <TipoChip subtipo={plano.subtipo} />}
            </div>
            <h3 className="pdco-plan-row-title">{tituloDoPlano(plano)}</h3>
            <div className="pdco-plan-row-progress">
                <ProgressoAcoes rotulo={`${rag.concluidas}/${rag.total} ações`} pct={pct} cor={cor} indice={indice} />
            </div>
            {rag.atrasadas > 0 && <span className="pdco-plan-row-atraso">{rag.atrasadas} atras.</span>}
            <RagBadge nivel={rag.nivel} score={rag.score} rag={rag} />
            <EpaLink codigo={plano.cd_planoacao} />
        </Link>
    )
}
