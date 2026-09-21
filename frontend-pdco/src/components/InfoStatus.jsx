import { InfoTooltip } from './InfoTooltip'
import { RAG_BASE, RAG_COLOR, RAG_FAIXA, RAG_LABEL, RAG_REGRA } from '../lib/pdcoCalc'

const NIVEIS = ['verde', 'amarelo', 'vermelho']

// Sinal de menos tipográfico; zero sem sinal.
const pontos = (n) => (n === 0 ? '0' : `−${Math.abs(n)}`)
const pct = (v) => `${Math.round(v * 100)}%`

/**
 * "i" discreto ao lado do status. Ao passar o mouse (ou focar/tocar) abre um balão com a
 * regra do status e, quando `rag` é informado, o passo a passo dos pontos daquele plano.
 * Os números vêm de RAG_REGRA/RAG_FAIXA — as mesmas constantes do cálculo (calcRag) —, então
 * o texto nunca diverge do que a tela realmente faz. O comportamento do balão está no InfoTooltip.
 */
export function InfoStatus({ rag }) {
    const P = RAG_REGRA.penalidades

    return (
        <InfoTooltip rotulo="Como o status é calculado">
            <p className="pdco-info-titulo">Como o status é calculado</p>
            <p>
                Todo plano começa com <strong>{RAG_BASE} pontos</strong> e perde pontos por:
            </p>
            <table className="pdco-info-tabela">
                <tbody>
                    <tr className="pdco-info-grupo">
                        <th rowSpan={4} scope="rowgroup">
                            Execução das ações
                            <small>concluídas ÷ total</small>
                        </th>
                        <td>{pct(RAG_REGRA.execucaoBoa)} ou mais</td>
                        <td>0</td>
                    </tr>
                    <tr>
                        <td>
                            {pct(RAG_REGRA.execucaoParcial)} a {pct(RAG_REGRA.execucaoBoa - 0.01)}
                        </td>
                        <td>{pontos(P.execucaoParcial)}</td>
                    </tr>
                    <tr>
                        <td>menos de {pct(RAG_REGRA.execucaoParcial)}</td>
                        <td>{pontos(P.execucaoBaixa)}</td>
                    </tr>
                    <tr>
                        <td>plano sem ações</td>
                        <td>{pontos(P.semAcoes)}</td>
                    </tr>
                    <tr className="pdco-info-grupo">
                        <th scope="row">
                            Ações atrasadas
                            <small>não concluídas no prazo</small>
                        </th>
                        <td>por ação (máx. {pontos(P.maxAtrasos)})</td>
                        <td>{pontos(P.porAtraso)}</td>
                    </tr>
                    <tr className="pdco-info-grupo">
                        <th rowSpan={3} scope="rowgroup">
                            Acompanhamento
                            <small>último registro</small>
                        </th>
                        <td>há até {RAG_REGRA.diasAcompanhamentoRecente} dias</td>
                        <td>0</td>
                    </tr>
                    <tr>
                        <td>há mais de {RAG_REGRA.diasAcompanhamentoRecente} dias</td>
                        <td>{pontos(P.acompanhamentoAntigo)}</td>
                    </tr>
                    <tr>
                        <td>nenhum registro</td>
                        <td>{pontos(P.semAcompanhamento)}</td>
                    </tr>
                </tbody>
            </table>
            <p className="pdco-info-subtitulo">Status conforme os pontos restantes:</p>
            <ul className="pdco-info-niveis">
                {NIVEIS.map((k) => (
                    <li key={k}>
                        <span className="pdco-info-bolinha" style={{ backgroundColor: RAG_COLOR[k] }} />
                        <strong style={{ color: RAG_COLOR[k] }}>{RAG_LABEL[k]}</strong> {RAG_FAIXA[k]}
                    </li>
                ))}
            </ul>

            {rag && (
                <div className="pdco-info-plano">
                    <p className="pdco-info-titulo">Neste plano: {rag.score} pontos</p>
                    <ul>
                        {rag.criterios.map((c) => (
                            <li key={c.chave}>
                                <span>
                                    <strong>{c.titulo}</strong> — {c.situacao}
                                </span>
                                <b className={c.pontos < 0 ? 'pdco-info-neg' : ''}>{pontos(c.pontos)}</b>
                            </li>
                        ))}
                        <li className="pdco-info-resultado" style={{ borderColor: RAG_COLOR[rag.nivel] }}>
                            <span>
                                {RAG_BASE} {rag.criterios.map((c) => pontos(c.pontos)).filter((t) => t !== '0').join(' ') || ''} ={' '}
                                <strong>{rag.score}</strong>
                            </span>
                            <b style={{ color: RAG_COLOR[rag.nivel] }}>{RAG_LABEL[rag.nivel]}</b>
                        </li>
                    </ul>
                </div>
            )}
        </InfoTooltip>
    )
}
