const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function chaveDoMes(iso) {
    if (!iso) return null
    const data = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(data.getTime())) return null
    return data.getFullYear() * 12 + data.getMonth()
}

// Previsão de conclusão por mês (calendário), a partir do prazo final de
// cada ação — independente da janela de 8 meses relativa ao início do plano
// (essa é a janela de acompanhamento, ver AcompanhamentoGrid).
export function PlanoTimeline({ plano, acoes }) {
    const inicio = chaveDoMes(plano.data_inicio) ?? Math.min(...acoes.map((a) => chaveDoMes(a.prazo_final)).filter(Boolean))
    const fim = chaveDoMes(plano.data_fim) ?? Math.max(...acoes.map((a) => chaveDoMes(a.prazo_final)).filter(Boolean))
    if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim < inicio) return null

    const hoje = new Date()
    const chaveHoje = hoje.getFullYear() * 12 + hoje.getMonth()

    const baldes = new Map()
    for (const acao of acoes) {
        const chave = chaveDoMes(acao.prazo_final)
        if (chave === null || chave < inicio || chave > fim) continue
        if (!baldes.has(chave)) baldes.set(chave, { total: 0, concluidas: 0, atrasadas: 0 })
        const balde = baldes.get(chave)
        balde.total++
        const status = (acao.status || '').toLowerCase()
        if (status === 'concluído' || status === 'concluido') balde.concluidas++
        else if (chaveHoje > chave || (chaveHoje === chave && new Date(acao.prazo_final) < hoje)) balde.atrasadas++
    }

    const totalAtrasadas = [...baldes.values()].reduce((s, b) => s + b.atrasadas, 0)

    const chaves = []
    for (let k = inicio; k <= fim; k++) chaves.push(k)

    return (
        <section className="pdco-panel pdco-timeline-card">
            <div className="pdco-timeline-head">
                <span className="pdco-kicker">Previsão de conclusão por mês</span>
                {totalAtrasadas > 0 && <span className="pdco-timeline-alerta">{totalAtrasadas} atrasada(s)</span>}
            </div>
            <div className="pdco-timeline-scroll">
                {chaves.map((chave) => {
                    const balde = baldes.get(chave) || { total: 0, concluidas: 0, atrasadas: 0 }
                    let tom = 'muted'
                    if (balde.total > 0) {
                        if (balde.atrasadas > 0) tom = 'danger'
                        else if (balde.concluidas === balde.total) tom = 'success'
                        else tom = 'info'
                    }
                    const atual = chave === chaveHoje
                    return (
                        <div key={chave} className={`pdco-timeline-cell pdco-timeline-${tom}`}>
                            {atual && <span className="pdco-timeline-atual" title="Mês atual" />}
                            <span className="pdco-timeline-mes">{MESES[((chave % 12) + 12) % 12]}</span>
                            <span className="pdco-timeline-total">{balde.total > 0 ? balde.total : '–'}</span>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
