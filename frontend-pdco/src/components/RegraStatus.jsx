import { RAG_BASE, RAG_COLOR, RAG_FAIXA, RAG_LABEL, RAG_REGRA } from '../lib/pdcoCalc'

const NIVEIS = ['verde', 'amarelo', 'vermelho']

// Sinal de menos tipográfico; zero sem sinal.
const pontos = (n) => (n === 0 ? '0' : `−${Math.abs(n)}`)
const pct = (v) => `${Math.round(v * 100)}%`

/**
 * Passo a passo de como um plano chegou ao score atual (100 → cada critério → resultado).
 * Usa `rag.criterios`, gerado por calcRag — o mesmo cálculo que define o status.
 */
export function ComoChegamos({ rag }) {
    return (
        <div className="pdco-regra-passos">
            <p className="pdco-regra-titulo">Como chegamos a {rag.score} pontos</p>
            <ul>
                <li className="pdco-regra-linha">
                    <span>Ponto de partida</span>
                    <span className="pdco-regra-pts">{RAG_BASE}</span>
                </li>
                {rag.criterios.map((c) => (
                    <li className="pdco-regra-linha" key={c.chave}>
                        <span>
                            <strong>{c.titulo}</strong> — {c.situacao}
                        </span>
                        <span className={`pdco-regra-pts ${c.pontos < 0 ? 'pdco-regra-pts-neg' : ''}`}>{pontos(c.pontos)}</span>
                    </li>
                ))}
                <li className="pdco-regra-linha pdco-regra-total" style={{ borderColor: RAG_COLOR[rag.nivel] }}>
                    <span>Resultado</span>
                    <span>
                        {rag.score} de {RAG_BASE} → <strong style={{ color: RAG_COLOR[rag.nivel] }}>{RAG_LABEL[rag.nivel]}</strong> ({RAG_FAIXA[rag.nivel]})
                    </span>
                </li>
            </ul>
        </div>
    )
}

/**
 * Caixa recolhível "Como o status é calculado?" — a regra completa (faixas e pontos
 * perdidos por critério). Lê tudo de RAG_REGRA/RAG_FAIXA, as mesmas constantes do
 * cálculo, então a explicação nunca diverge do que a tela realmente faz.
 */
export function RegraStatus() {
    const P = RAG_REGRA.penalidades
    return (
        <details className="pdco-regra">
            <summary>Como o status é calculado?</summary>
            <div className="pdco-regra-corpo">
                <p>
                    Todo plano começa com <strong>{RAG_BASE} pontos</strong> e perde pontos conforme a execução das ações, os atrasos e o
                    acompanhamento. O total de pontos define o status:
                </p>
                <ul className="pdco-regra-niveis">
                    {NIVEIS.map((k) => (
                        <li key={k}>
                            <span className="pdco-regra-bolinha" style={{ backgroundColor: RAG_COLOR[k] }} />
                            <strong style={{ color: RAG_COLOR[k] }}>{RAG_LABEL[k]}</strong>
                            <span>{RAG_FAIXA[k]}</span>
                        </li>
                    ))}
                </ul>

                <table className="pdco-regra-tabela">
                    <thead>
                        <tr>
                            <th>Critério</th>
                            <th>Situação</th>
                            <th>Pontos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td rowSpan={4}>
                                <strong>Execução das ações</strong>
                                <small>ações concluídas ÷ ações do plano</small>
                            </td>
                            <td>{pct(RAG_REGRA.execucaoBoa)} ou mais concluídas</td>
                            <td>0</td>
                        </tr>
                        <tr>
                            <td>
                                de {pct(RAG_REGRA.execucaoParcial)} a {pct(RAG_REGRA.execucaoBoa - 0.01)} concluídas
                            </td>
                            <td className="pdco-regra-pts-neg">{pontos(P.execucaoParcial)}</td>
                        </tr>
                        <tr>
                            <td>menos de {pct(RAG_REGRA.execucaoParcial)} concluídas</td>
                            <td className="pdco-regra-pts-neg">{pontos(P.execucaoBaixa)}</td>
                        </tr>
                        <tr>
                            <td>plano sem ações cadastradas</td>
                            <td className="pdco-regra-pts-neg">{pontos(P.semAcoes)}</td>
                        </tr>
                        <tr>
                            <td>
                                <strong>Ações atrasadas</strong>
                                <small>prazo final vencido e não concluídas</small>
                            </td>
                            <td>cada ação atrasada (máximo de {pontos(P.maxAtrasos)})</td>
                            <td className="pdco-regra-pts-neg">{pontos(P.porAtraso)}</td>
                        </tr>
                        <tr>
                            <td rowSpan={3}>
                                <strong>Acompanhamento</strong>
                                <small>registros do plano e das ações</small>
                            </td>
                            <td>último registro há até {RAG_REGRA.diasAcompanhamentoRecente} dias</td>
                            <td>0</td>
                        </tr>
                        <tr>
                            <td>último registro há mais de {RAG_REGRA.diasAcompanhamentoRecente} dias</td>
                            <td className="pdco-regra-pts-neg">{pontos(P.acompanhamentoAntigo)}</td>
                        </tr>
                        <tr>
                            <td>nenhum registro</td>
                            <td className="pdco-regra-pts-neg">{pontos(P.semAcompanhamento)}</td>
                        </tr>
                    </tbody>
                </table>
                <p className="pdco-regra-nota">
                    Ações canceladas não entram na conta. O cálculo é automático, a partir das ações e dos acompanhamentos cadastrados no sistema.
                </p>
            </div>
        </details>
    )
}
