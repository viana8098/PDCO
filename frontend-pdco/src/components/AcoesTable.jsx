import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { iniciaisDoNome } from '../lib/iniciais'
import { acaoAtrasada, acaoCancelada, acaoConcluida, chaveDoMes, formatarData, rotuloDaChave } from '../lib/pdcoCalc'
import { StatusPill } from './StatusPill'

const COLUNAS = [
    { chave: 'nome', rotulo: 'Ação' },
    { chave: 'status', rotulo: 'Status' },
    { chave: 'prazo_inicial', rotulo: 'Prazo inicial' },
    { chave: 'prazo_final', rotulo: 'Prazo final' },
    { chave: 'responsavel', rotulo: 'Responsável' },
]

// Compara duas ações por uma coluna — string ou data ISO (yyyy-mm-dd), sem
// distinguir maiúsculas/minúsculas; valores vazios sempre vão pro final,
// não importa a direção.
function comparar(a, b, coluna) {
    const va = a[coluna]
    const vb = b[coluna]
    if (!va && !vb) return 0
    if (!va) return 1
    if (!vb) return -1
    return String(va).localeCompare(String(vb), 'pt-BR', { sensitivity: 'base', numeric: true })
}

// Com um mês filtrado, o que está atrasado vem primeiro; depois as pendentes,
// as concluídas e, por último, as canceladas (só listadas, não contam).
function pesoNoFiltro(acao, hoje) {
    if (acaoCancelada(acao)) return 3
    if (acaoConcluida(acao)) return 2
    return acaoAtrasada(acao, hoje) ? 0 : 1
}

/**
 * Tabela de ações do plano. `mesFiltro` (chave de ano*12+mês, vem da timeline
 * de previsão) recorta a tabela pelo mês do prazo final e destaca as atrasadas.
 */
export function AcoesTable({ acoes, mesFiltro = null, onLimparFiltro }) {
    const { cdPlanoAcao } = useParams()
    // null = ordem original (como veio da API); senão { coluna, direcao: 1 | -1 }
    const [ordenacao, setOrdenacao] = useState(null)
    const filtroRef = useRef(null)
    const filtrando = mesFiltro !== null
    const hoje = useMemo(() => new Date(), [])

    // Trocar de mês na timeline não deve exigir rolar a página de volta: só
    // rola se o cabeçalho do filtro estiver fora da tela.
    useEffect(() => {
        const cabecalho = filtroRef.current
        if (!cabecalho) return
        const retangulo = cabecalho.getBoundingClientRect()
        if (retangulo.top < 0 || retangulo.bottom > window.innerHeight) {
            cabecalho.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [mesFiltro])

    function alternarOrdenacao(coluna) {
        setOrdenacao((atual) => {
            if (!atual || atual.coluna !== coluna) return { coluna, direcao: 1 }
            if (atual.direcao === 1) return { coluna, direcao: -1 }
            return null
        })
    }

    const linhas = useMemo(() => (filtrando ? acoes.filter((a) => chaveDoMes(a.prazo_final) === mesFiltro) : acoes), [acoes, mesFiltro, filtrando])

    const acoesOrdenadas = useMemo(() => {
        if (ordenacao) {
            const { coluna, direcao } = ordenacao
            return [...linhas].sort((a, b) => direcao * comparar(a, b, coluna))
        }
        if (filtrando) return [...linhas].sort((a, b) => pesoNoFiltro(a, hoje) - pesoNoFiltro(b, hoje) || comparar(a, b, 'prazo_final'))
        return linhas
    }, [linhas, ordenacao, filtrando, hoje])

    const resumo = useMemo(() => {
        if (!filtrando) return null
        const ativas = linhas.filter((a) => !acaoCancelada(a))
        return {
            ativas: ativas.length,
            atrasadas: ativas.filter((a) => acaoAtrasada(a, hoje)).length,
            canceladas: linhas.length - ativas.length,
        }
    }, [linhas, filtrando, hoje])

    return (
        <>
            {filtrando && (
                <div ref={filtroRef} className={`pdco-acoes-filtro ${resumo.atrasadas > 0 ? 'pdco-acoes-filtro-atraso' : ''}`}>
                    <div className="pdco-acoes-filtro-textos">
                        <span className="pdco-acoes-filtro-titulo">
                            {resumo.atrasadas > 0 ? 'Atrasados' : 'Prazo em'} — {rotuloDaChave(mesFiltro)}
                        </span>
                        <span className="pdco-acoes-filtro-info">
                            {resumo.ativas} ação(ões) no mês · {resumo.atrasadas} atrasada(s)
                            {resumo.canceladas > 0 && ` · ${resumo.canceladas} cancelada(s), só listada(s)`}
                        </span>
                    </div>
                    <button type="button" className="pdco-acoes-filtro-limpar" onClick={onLimparFiltro}>
                        Limpar filtro ×
                    </button>
                </div>
            )}

            {linhas.length ? (
                <table className="pdco-tabela-acoes">
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
                        {acoesOrdenadas.map((acao) => (
                            <tr key={acao.cd_acao} className={filtrando && acaoAtrasada(acao, hoje) ? 'pdco-acao-destacada' : ''}>
                                <td>
                                    <Link
                                        className="pdco-acao-link"
                                        to={`/plano/${encodeURIComponent(cdPlanoAcao)}/acao/${encodeURIComponent(acao.cd_acao)}`}
                                    >
                                        {acao.nome || '-'}
                                    </Link>
                                </td>
                                <td>
                                    <StatusPill status={acao.status} />
                                </td>
                                <td>{formatarData(acao.prazo_inicial)}</td>
                                <td>{formatarData(acao.prazo_final)}</td>
                                <td>
                                    {acao.responsavel ? (
                                        <span className="pdco-responsavel-cell">
                                            <span className="pdco-avatar">{iniciaisDoNome(acao.responsavel)}</span>
                                            {acao.responsavel}
                                        </span>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="pdco-vazio">
                    {filtrando ? `Nenhuma ação com prazo em ${rotuloDaChave(mesFiltro)}.` : 'Nenhuma ação cadastrada para este plano.'}
                </p>
            )}
        </>
    )
}
