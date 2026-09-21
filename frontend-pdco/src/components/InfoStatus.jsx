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
            <ul className="pdco-info-regras">
                <li>
                    <strong>Execução das ações</strong> (concluídas ÷ total): {pct(RAG_REGRA.execucaoBoa)} ou mais <b>0</b> · de{' '}
                    {pct(RAG_REGRA.execucaoParcial)} a {pct(RAG_REGRA.execucaoBoa - 0.01)} <b>{pontos(P.execucaoParcial)}</b> · menos de{' '}
                    {pct(RAG_REGRA.execucaoParcial)} <b>{pontos(P.execucaoBaixa)}</b> · sem ações <b>{pontos(P.semAcoes)}</b>
                </li>
                <li>
                    <strong>Ações atrasadas</strong> (prazo vencido e não concluídas): <b>{pontos(P.porAtraso)}</b> por ação, no máximo{' '}
                    <b>{pontos(P.maxAtrasos)}</b>
                </li>
                <li>
                    <strong>Acompanhamento</strong>: último registro há até {RAG_REGRA.diasAcompanhamentoRecente} dias <b>0</b> · há mais
                    de {RAG_REGRA.diasAcompanhamentoRecente} dias <b>{pontos(P.acompanhamentoAntigo)}</b> · nenhum <b>{pontos(P.semAcompanhamento)}</b>
                </li>
            </ul>
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
