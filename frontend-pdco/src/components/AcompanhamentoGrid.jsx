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
 * Tabela de acompanhamentos em colunas (Acompanhamento / Mês / Responsável / Data), mais recente
 * primeiro, com colunas ordenáveis — a mesma tabela para o plano e para a ação.
 * `registros`: [{ texto, data (yyyy-mm-dd), mes (número do mês do plano ou null), responsavel }].
 * O dw não guarda quem escreveu o acompanhamento — o responsável é o do plano (ou o da ação).
 * `vazio` é o texto quando não há registros; `nota` (opcional) vai abaixo da tabela.
 */
export function TabelaAcompanhamentos({ registros, vazio, nota }) {
    // null = ordem original (mais recente primeiro); senão { coluna, direcao: 1 | -1 }
    const [ordenacao, setOrdenacao] = useState(null)

    const maisRecentesPrimeiro = useMemo(() => [...registros].sort((a, b) => (b.data || '').localeCompare(a.data || '')), [registros])

    const registrosOrdenados = useMemo(() => {
        if (!ordenacao) return maisRecentesPrimeiro
        const { coluna, direcao } = ordenacao
        return [...maisRecentesPrimeiro].sort((a, b) => direcao * comparar(a, b, coluna))
    }, [maisRecentesPrimeiro, ordenacao])

    function alternarOrdenacao(coluna) {
        setOrdenacao((atual) => {
            if (!atual || atual.coluna !== coluna) return { coluna, direcao: 1 }
            if (atual.direcao === 1) return { coluna, direcao: -1 }
            return null
        })
    }

    if (registros.length === 0) {
        return (
            <p className="pdco-vazio">
                {vazio}
                {nota && ` ${nota}`}
            </p>
        )
    }

    return (
        <>
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
                            <td>{registro.mes ? `Mês ${registro.mes}` : '—'}</td>
                            <td>{registro.responsavel || '—'}</td>
                            <td>{formatarData(registro.data)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {nota && <p className="pdco-acomp-nota">{nota}</p>}
        </>
    )
}

/**
 * Aba "Acompanhamentos do plano": o texto vem de `ds_acompanhamentoplanoacao` do dw (registros com
 * origem 'plano' em `acompanhamento`, ver domain/pdco.rules.ts#montarJanelaAcompanhamento). Os
 * acompanhamentos das ações (`ds_acompanhamentoacao`) não entram aqui — aparecem na página de cada
 * ação; quando o plano tem, uma nota avisa quantos são.
 */
export function AcompanhamentoGrid({ quadrantes, plano }) {
    const { registros, qtdAcoes } = useMemo(() => {
        const todos = quadrantes.flatMap((q) => q.registros.map((r) => ({ ...r, mes: q.mes, responsavel: plano.responsavel })))
        const doPlano = todos.filter((r) => r.origem === 'plano')
        return { registros: doPlano, qtdAcoes: todos.length - doPlano.length }
    }, [quadrantes, plano.responsavel])

    const plural = qtdAcoes === 1 ? '' : 's'
    const nota =
        qtdAcoes > 0 ? `O plano também tem ${qtdAcoes} acompanhamento${plural} registrado${plural} nas ações — veja na página de cada ação.` : null

    return <TabelaAcompanhamentos registros={registros} vazio="Nenhum acompanhamento do plano registrado." nota={nota} />
}
