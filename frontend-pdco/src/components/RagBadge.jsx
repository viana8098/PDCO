import { RAG_BG, RAG_COLOR, RAG_LABEL } from '../lib/pdcoCalc'

// Badge "Verde/Amarelo/Vermelho · score" — resumo de saúde do plano.
export function RagBadge({ nivel, score, size = 'sm' }) {
    return (
        <span
            className={`pdco-rag-badge pdco-rag-badge-${size}`}
            style={{ backgroundColor: RAG_BG[nivel], color: RAG_COLOR[nivel], borderColor: RAG_COLOR[nivel] }}
        >
            <span className="pdco-rag-dot" style={{ backgroundColor: RAG_COLOR[nivel] }} />
            {RAG_LABEL[nivel]}
            {typeof score === 'number' ? ` · ${score}` : ''}
        </span>
    )
}
