import { tipoResumido } from '../lib/pdcoCalc'

// Chip "Tático"/"Estratégico" a partir do subtipo bruto do EPA. Sem match
// reconhecido, não renderiza nada (mesma cautela do StatusPill).
export function TipoChip({ subtipo }) {
    const tipo = tipoResumido(subtipo)
    if (!tipo) return null
    const estrategico = tipo === 'Estratégico'
    return <span className={`pdco-tipo-chip ${estrategico ? 'pdco-tipo-estrategico' : 'pdco-tipo-tatico'}`}>{tipo}</span>
}
