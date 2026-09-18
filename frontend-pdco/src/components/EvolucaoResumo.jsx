import { montarCards, montarFaixa } from '../lib/evolucao'

/** Os 3 cartões comparativos: cada um é um filtro (clicar de novo limpa). */
export function EvolucaoCards({ comp, foco, onFoco }) {
    const cards = montarCards(comp)
    return (
        <div className="pdco-evo-diff-grid">
            {cards.map((c) => (
                <button
                    type="button"
                    key={c.id}
                    className={`pdco-evo-diff-card ${foco === c.id ? 'pdco-evo-diff-card-ativo' : ''}`}
                    aria-pressed={foco === c.id}
                    onClick={() => onFoco(foco === c.id ? null : c.id)}
                >
                    <span className="pdco-stat-label">{c.rotulo}</span>
                    <span className="pdco-stat-valor">{c.valor}</span>
                    <span className="pdco-evo-diff-comparacao">{c.comparacao}</span>
                    <span className={`pdco-evo-delta pdco-evo-delta-${c.variacao.tom}`}>
                        <span aria-hidden="true">{c.variacao.seta}</span> {c.variacao.texto}
                    </span>
                    <span className="pdco-evo-diff-dica">{foco === c.id ? 'Filtro ativo — clique para limpar' : 'Clique para filtrar'}</span>
                </button>
            ))}
        </div>
    )
}

/** Faixa "Principais mudanças no período": totais do intervalo, cada um também filtra. */
export function EvolucaoFaixa({ comp, foco, onFoco }) {
    const { titulo, itens } = montarFaixa(comp)
    return (
        <div className="pdco-evo-faixa">
            <p className="pdco-kicker">Principais mudanças no período</p>
            <div className="pdco-evo-faixa-corpo">
                <span className="pdco-evo-faixa-titulo">{titulo}</span>
                <ul className="pdco-evo-faixa-itens">
                    {itens.map((i) => (
                        <li key={i.foco}>
                            <button
                                type="button"
                                className={`pdco-evo-chip pdco-evo-chip-${i.tom} ${i.valor === 0 ? 'pdco-evo-chip-zero' : ''} ${foco === i.foco ? 'pdco-evo-chip-ativo' : ''}`}
                                aria-pressed={foco === i.foco}
                                onClick={() => onFoco(foco === i.foco ? null : i.foco)}
                            >
                                {i.texto}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
