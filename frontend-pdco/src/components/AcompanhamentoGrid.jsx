import { useMemo, useState } from 'react'
import { formatarData } from '../lib/pdcoCalc'

const COLUNAS = [
    { chave: 'texto', rotulo: 'Acompanhamento' },
    { chave: 'mes', rotulo: 'Mês' },
    { chave: 'responsavel', rotulo: 'Responsável' },
    { chave: 'data', rotulo: 'Data' },
]

// Compara dois acompanhamentos por uma coluna — número (mês) ou texto/data ISO
// (yyyy-mm-dd) sem distinguir maiúsculas; vazios sempre vão pro final,
// não importa a direção.
function comparar(a, b, coluna) {
    const va = a[coluna]
    const vb = b[coluna]
    if (!va && !vb) return 0
    if (!va) return 1
    if (!vb) return -1
    return String(va).localeCompare(String(vb), 'pt-BR', { sensitivity: 'base', numeric: true })
}

/**
 * Tabela (mais recente primeiro) dos acompanhamentos do dw — plano + ações,
 * já juntados em `acompanhamento` (ver domain/pdco.rules.ts#montarJanelaAcompanhamento).
 * Colunas ordenáveis, no mesmo padrão da tabela de ações. O dw não guarda quem
 * escreveu o acompanhamento — o responsável é o do plano.
 */
export function AcompanhamentoGrid({ quadrantes, plano }) {
    // null = ordem original (mais recente primeiro); senão { coluna, direcao: 1 | -1 }
    const [ordenacao, setOrdenacao] = useState(null)

    const registros = useMemo(
        () =>
            quadrantes
                .flatMap((q) => q.registros.map((r) => ({ ...r, mes: q.mes, responsavel: plano.responsavel })))
                .sort((a, b) => (b.data || '').localeCompare(a.data || '')),
        [quadrantes, plano.responsavel],
    )

    const registrosOrdenados = useMemo(() => {
        if (!ordenacao) return registros
        const { coluna, direcao } = ordenacao
        return [...registros].sort((a, b) => direcao * comparar(a, b, coluna))
    }, [registros, ordenacao])

    function alternarOrdenacao(coluna) {
        setOrdenacao((atual) => {
            if (!atual || atual.coluna !== coluna) return { coluna, direcao: 1 }
            if (atual.direcao === 1) return { coluna, direcao: -1 }
            return null
        })
    }

    if (registros.length === 0) {
        return <p className="pdco-vazio">Nenhum acompanhamento registrado para este plano.</p>
    }

    return (
        <table className="pdco-tabela-acoes pdco-tabela-acomp">
            <thead>
                <tr>
                    {COLUNAS.map((col) => {
                        const ativa = ordenacao?.coluna === col.chave
                        return (
                            <th key={col.chave}>
                                <button
                                    type="button"
                                    className={`pdco-th-ordenavel ${ativa ? 'pdco-th-ativa' : ''}`}
                                    onClick={() => alternarOrdenacao(col.chave)}
                                    title="Ordenar"
                                >
                                    {col.rotulo}
                                    <span className="pdco-th-seta">{ativa ? (ordenacao.direcao === 1 ? '▲' : '▼') : '↕'}</span>
                                </button>
                            </th>
                        )
                    })}
                </tr>
            </thead>
            <tbody>
                {registrosOrdenados.map((registro, indice) => (
                    <tr key={indice}>
                        <td className="pdco-acomp-texto">{registro.texto}</td>
                        <td>Mês {registro.mes}</td>
                        <td>{registro.responsavel || '—'}</td>
                        <td>{formatarData(registro.data)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
