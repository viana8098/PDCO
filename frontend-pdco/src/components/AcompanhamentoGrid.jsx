import { useState } from 'react'
import { formatarData, indiceMesRelativo } from '../lib/pdcoCalc'

const MESES_PT = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Painel "Acompanhamentos mensais": 8 meses a partir do início do plano.
// Cada mês é um acordeão com os acompanhamentos do dw (plano + ações) e as
// ações concluídas naquele mês. Anexos ficam de fora (ver escopo funcional).
export function AcompanhamentoGrid({ quadrantes, plano, acoes }) {
    const [abertos, setAbertos] = useState(() => new Set())

    function alternar(mes) {
        setAbertos((atual) => {
            const proximo = new Set(atual)
            if (proximo.has(mes)) proximo.delete(mes)
            else proximo.add(mes)
            return proximo
        })
    }

    return (
        <section className="pdco-panel">
            <div className="pdco-panel-header">
                <p className="pdco-kicker">Acompanhamento estratégico</p>
                <h2 className="pdco-panel-title">Acompanhamentos mensais</h2>
                <p className="pdco-panel-subtitle">8 meses a partir da criação</p>
            </div>

            {quadrantes.length ? (
                <div className="pdco-month-list">
                    {quadrantes.map((quadrante) => {
                        const concluidasNoMes = acoes.filter(
                            (a) =>
                                (a.status || '').toLowerCase().startsWith('conclu') &&
                                indiceMesRelativo(plano.data_inicio, a.prazo_final) === quadrante.mes - 1,
                        )
                        const temAlgo = quadrante.registros.length > 0 || concluidasNoMes.length > 0
                        const aberto = abertos.has(quadrante.mes)

                        return (
                            <div className={`pdco-month-item ${temAlgo ? 'pdco-month-com-registro' : ''}`} key={quadrante.mes}>
                                <button type="button" className="pdco-month-item-head" onClick={() => alternar(quadrante.mes)}>
                                    <span className="pdco-month-dot" />
                                    <span className="pdco-month-label">
                                        Mês {quadrante.mes} · {MESES_PT[quadrante.mes_referencia]}/{quadrante.ano}
                                    </span>
                                    <span className="pdco-month-resumo">
                                        {quadrante.registros.length} acompanh. · {concluidasNoMes.length} ação(ões) concl.
                                    </span>
                                    <span className={`pdco-month-caret ${aberto ? 'pdco-month-caret-aberto' : ''}`}>▾</span>
                                </button>

                                {aberto && (
                                    <div className="pdco-month-item-body">
                                        {!temAlgo && <p className="pdco-month-vazio">Sem movimentações neste mês.</p>}
                                        {concluidasNoMes.map((a) => (
                                            <p className="pdco-month-evento" key={a.cd_acao}>
                                                <strong>Ação concluída:</strong> {a.nome}
                                            </p>
                                        ))}
                                        {quadrante.registros.map((registro, indice) => (
                                            <p className="pdco-month-evento" key={indice}>
                                                {registro.texto}
                                                <span className="pdco-month-evento-data"> — {formatarData(registro.data)}</span>
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="pdco-vazio">
                    Sem data de início cadastrada — não é possível montar a janela de acompanhamento.
                </p>
            )}
        </section>
    )
}
