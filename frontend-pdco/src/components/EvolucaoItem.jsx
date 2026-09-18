import { useState } from 'react'

/**
 * Item da página Evolução Mensal: badge(s) do tipo de mudança, título, descrição
 * curta (até 2 linhas), data/responsável e "Ver detalhes" para abrir o texto
 * completo e os dados da ação/plano. O tipo aparece sempre em texto no badge —
 * a cor da borda é só reforço.
 */
export function EvolucaoItem({ item }) {
    const [aberto, setAberto] = useState(false)
    const idDetalhes = `evo-det-${item.id}`

    return (
        <article className={`pdco-evo-item pdco-evo-item-${item.tags[0]}`}>
            <div className="pdco-evo-item-topo">
                <span className="pdco-evo-badges">
                    {item.badges.map((b) => (
                        <span key={b.id} className={`pdco-evo-badge pdco-evo-badge-${b.id}`}>
                            {b.rotulo}
                        </span>
                    ))}
                </span>
                <span className="pdco-evo-item-data">{item.rotuloData}</span>
            </div>
            <h3 className="pdco-evo-item-titulo">{item.titulo}</h3>
            {item.descricao && <p className={`pdco-evo-item-desc ${aberto ? '' : 'pdco-evo-item-desc-curta'}`}>{item.descricao}</p>}
            <div className="pdco-evo-item-rodape">
                <span className="pdco-evo-item-resp">{item.responsavel || ''}</span>
                <button
                    type="button"
                    className="pdco-evo-item-toggle"
                    aria-expanded={aberto}
                    aria-controls={idDetalhes}
                    onClick={() => setAberto((v) => !v)}
                >
                    {aberto ? 'Ocultar detalhes' : 'Ver detalhes'}
                </button>
            </div>
            {aberto && (
                <dl className="pdco-evo-item-detalhes" id={idDetalhes}>
                    {item.detalhes.map((d) => (
                        <div key={d.rotulo}>
                            <dt>{d.rotulo}</dt>
                            <dd>{d.valor}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </article>
    )
}
