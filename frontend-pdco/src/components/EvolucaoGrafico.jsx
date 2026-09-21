const SERIES_BASE = [
    { chave: 'concluidas', rotulo: 'Concluídas' },
    { chave: 'atrasadas', rotulo: 'Atrasadas' },
    { chave: 'acompanhamentos', rotulo: 'Acompanhamentos' },
]
// Só o app corporativo tem anexos — a série entra junto com o cartão.
const SERIE_ANEXOS = { chave: 'anexos', rotulo: 'Anexos' }

/**
 * Gráfico compacto dos meses do ciclo (barras agrupadas em HTML/CSS, sem
 * biblioteca): concluídas e acompanhamentos são o movimento do mês; atrasadas é
 * o total em aberto no fim do mês. Cada mês é um botão — clicar seleciona o mês
 * como período (comparado com o anterior). Os números aparecem sobre as barras e
 * no balão de hover/foco, então nada depende só de cor.
 */
export function EvolucaoGrafico({ meses, selecionado, comparado, temAnexos, onSelecionar }) {
    const SERIES = temAnexos ? [...SERIES_BASE, SERIE_ANEXOS] : SERIES_BASE
    const maximo = Math.max(1, ...meses.flatMap((m) => (m.metricas ? SERIES.map((s) => m.metricas[s.chave]) : [0])))

    return (
        <div className="pdco-evo-graf">
            <ul className="pdco-evo-graf-legenda" aria-hidden="true">
                {SERIES.map((s) => (
                    <li key={s.chave}>
                        <span className={`pdco-evo-graf-marca pdco-evo-graf-${s.chave}`} />
                        {s.rotulo}
                    </li>
                ))}
            </ul>
            <div className="pdco-evo-graf-area" role="group" aria-label="Comparativo mensal do ciclo — clique em um mês para selecioná-lo">
                {meses.map((m, i) => {
                    const virada = i > 0 && m.ano !== meses[i - 1].ano
                    const classes = [
                        'pdco-evo-graf-col',
                        m.mes === selecionado ? 'pdco-evo-graf-col-sel' : '',
                        m.mes === comparado ? 'pdco-evo-graf-col-comp' : '',
                        m.futuro ? 'pdco-evo-graf-col-futuro' : '',
                        virada ? 'pdco-evo-graf-col-virada' : '',
                        i < 2 ? 'pdco-evo-graf-tip-esq' : '',
                        i > meses.length - 3 ? 'pdco-evo-graf-tip-dir' : '',
                    ]
                        .filter(Boolean)
                        .join(' ')
                    const met = m.metricas
                    const rotuloAria = met
                        ? `${m.rotulo}, Mês ${m.mes}: ${met.concluidas} concluídas, ${met.atrasadas} atrasadas, ${met.acompanhamentos} acompanhamentos${temAnexos ? `, ${met.anexos} ${met.anexos === 1 ? 'anexo' : 'anexos'}` : ''}`
                        : `${m.rotulo}, Mês ${m.mes}: ainda não iniciado`
                    return (
                        <button
                            type="button"
                            key={m.mes}
                            className={classes}
                            style={{ '--i': i }}
                            disabled={m.futuro}
                            aria-pressed={m.mes === selecionado}
                            aria-label={rotuloAria}
                            onClick={() => onSelecionar(m.mes)}
                        >
                            {(virada || i === 0) && <span className="pdco-evo-graf-ano">{m.ano}</span>}
                            <span className="pdco-evo-graf-barras">
                                {met &&
                                    SERIES.map((s) => (
                                        <span
                                            key={s.chave}
                                            className="pdco-evo-graf-barra-box"
                                            style={{ '--h': met[s.chave] > 0 ? `${Math.max((met[s.chave] / maximo) * 100, 3)}%` : '0%' }}
                                        >
                                            <span className="pdco-evo-graf-valor">{met[s.chave]}</span>
                                            <span className={`pdco-evo-graf-barra pdco-evo-graf-${s.chave}`} />
                                        </span>
                                    ))}
                            </span>
                            <span className="pdco-evo-graf-mes">
                                {m.rotulo.slice(0, 3)}
                                <small>Mês {m.mes}</small>
                            </span>
                            <span className="pdco-evo-graf-tip" aria-hidden="true">
                                <strong>
                                    {m.rotulo} · Mês {m.mes}
                                    {m.atual ? ' (em andamento)' : ''}
                                </strong>
                                {met ? (
                                    SERIES.map((s) => (
                                        <span key={s.chave}>
                                            <i className={`pdco-evo-graf-marca pdco-evo-graf-${s.chave}`} />
                                            {s.rotulo}: <b>{met[s.chave]}</b>
                                        </span>
                                    ))
                                ) : (
                                    <span>Ainda não iniciado</span>
                                )}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
