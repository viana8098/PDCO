import { InfoTooltip } from './InfoTooltip'
import { CONCLUSAO_FAIXA, RAG_COLOR, RAG_LABEL } from '../lib/pdcoCalc'

const NIVEIS = ['verde', 'amarelo', 'vermelho']

/**
 * "i" discreto ao lado de "Conclusão de ações": como o percentual é calculado, o que cada anel abrange
 * e o que significa cada cor. As faixas vêm de CONCLUSAO_FAIXA (a mesma constante que o CultureGauge usa
 * para pintar o anel), então o texto nunca diverge da cor que aparece na tela. `comEmpresa` acompanha o
 * banner: quem só enxerga os próprios planos tem um anel só ("Meus planos"). O balão é do InfoTooltip.
 */
export function InfoConclusao({ comEmpresa = true }) {
    return (
        <InfoTooltip rotulo="Como a conclusão de ações e as cores dos anéis são calculadas">
            <p className="pdco-info-titulo">Conclusão de ações</p>
            <p>
                <strong>Cálculo:</strong> ações concluídas ÷ total de ações (canceladas não entram).
            </p>
            <ul className="pdco-info-escopo">
                {comEmpresa ? (
                    <>
                        <li>
                            <strong>Esta área</strong>
                            <span>planos exibidos na tela</span>
                        </li>
                        <li>
                            <strong>Empresa</strong>
                            <span>todos os planos</span>
                        </li>
                    </>
                ) : (
                    <li>
                        <strong>Meus planos</strong>
                        <span>seus planos exibidos na tela</span>
                    </li>
                )}
            </ul>
            <p className="pdco-info-subtitulo">
                <strong>Cor do anel</strong> (% de ações concluídas):
            </p>
            <ul className="pdco-info-faixas">
                {NIVEIS.map((k) => (
                    <li key={k}>
                        <span className="pdco-info-bolinha" style={{ backgroundColor: RAG_COLOR[k] }} />
                        <span>
                            <strong style={{ color: RAG_COLOR[k] }}>{RAG_LABEL[k]}</strong> — {CONCLUSAO_FAIXA[k]}
                        </span>
                    </li>
                ))}
            </ul>
            <p className="pdco-info-nota">Não é o status do plano, que tem regra própria (veja o “i” ao lado dele).</p>
        </InfoTooltip>
    )
}
