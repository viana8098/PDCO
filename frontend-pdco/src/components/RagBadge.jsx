import { RAG_BG, RAG_COLOR, RAG_LABEL } from '../lib/pdcoCalc'
import { InfoStatus } from './InfoStatus'

// Badge "Em dia/Atenção/Crítico · score" — resumo de saúde do plano, com um "i" discreto ao lado
// que explica a regra do status (e, se `rag` for passado, o passo a passo dos pontos do plano).
export function RagBadge({ nivel, score, size = 'sm', rag }) {
    return (
        <span className="pdco-rag-wrap">
            <span
                className={`pdco-rag-badge pdco-rag-badge-${size}`}
                style={{ backgroundColor: RAG_BG[nivel], color: RAG_COLOR[nivel], borderColor: RAG_COLOR[nivel] }}
            >
                <span className="pdco-rag-dot" style={{ backgroundColor: RAG_COLOR[nivel] }} />
                {RAG_LABEL[nivel]}
                {typeof score === 'number' ? ` · ${score}` : ''}
            </span>
            <InfoStatus rag={rag} />
        </span>
    )
}
