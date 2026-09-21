import { InfoTooltip } from './InfoTooltip'
import { CONCLUSAO_FAIXA, RAG_COLOR, RAG_LABEL } from '../lib/pdcoCalc'

const NIVEIS = ['verde', 'amarelo', 'vermelho']

/**
 * "i" discreto ao lado de "Conclusão de ações": como o percentual é calculado e o que cada cor do anel
 * significa. As faixas vêm de CONCLUSAO_FAIXA (a mesma constante que o CultureGauge usa para pintar o
 * anel), então o texto nunca diverge da cor que aparece na tela. O balão é do InfoTooltip.
 */
export function InfoConclusao() {
    return (
        <InfoTooltip rotulo="Como a conclusão de ações e as cores dos anéis são calculadas">
            <p className="pdco-info-titulo">Conclusão de ações</p>
            <p>
                <strong>Como é calculada:</strong> ações concluídas ÷ total de ações dos planos. Ações canceladas não entram na conta.
            </p>
            <p>
                <strong>Esta área</strong> (ou <strong>Meus planos</strong>) considera os planos que estão na tela, com os filtros aplicados;{' '}
                <strong>Empresa</strong> considera todos os planos.
            </p>
            <p>
                <strong>Cor do anel</strong> — faixa do percentual de ações concluídas:
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
            <p className="pdco-info-nota">
                O status de cada plano (Em dia, Atenção, Crítico) tem regra própria — leva em conta também atrasos e acompanhamento. Veja o “i”
                ao lado do status, na tela do plano.
            </p>
        </InfoTooltip>
    )
}
