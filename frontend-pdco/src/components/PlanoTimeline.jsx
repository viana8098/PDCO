const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function chaveDoMes(iso) {
    if (!iso) return null
    const data = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(data.getTime())) return null
    return data.getFullYear() * 12 + data.getMonth()
}

// Previsão de conclusão por mês (calendário), a partir do prazo final de
// cada ação — independente da janela de 8 meses relativa ao início do plano
// (essa é a janela de acompanhamento, ver AcompanhamentoGrid). A janela vai
// do primeiro ao último mês que realmente tem ação com prazo — não usa as
// datas de início/fim do plano, que costumam ser mais largas que os prazos
// reais e deixavam meses vazios sobrando nas pontas.
export function PlanoTimeline({ acoes }) {
    const hoje = new Date()
    const chaveHoje = hoje.getFullYear() * 12 + hoje.getMonth()

    const baldes = new Map()
    for (const acao of acoes) {
        const status = (acao.status || '').toLowerCase()
        // Cancelada não entra em lugar nenhum dessa conta — mesmo critério do
        // resumo do back-end (calcularResumoAcoes): não é atraso nem pendência.
        if (status.startsWith('cancel')) continue
        const chave = chaveDoMes(acao.prazo_final)
        if (chave === null) continue
        if (!baldes.has(chave)) baldes.set(chave, { total: 0, concluidas: 0, atrasadas: 0 })
        const balde = baldes.get(chave)
        balde.total++
        if (status === 'concluído' || status === 'concluido') balde.concluidas++
        else if (chaveHoje > chave || (chaveHoje === chave && new Date(acao.prazo_final) < hoje)) balde.atrasadas++
    }

    if (baldes.size === 0) return null

    const chavesComDados = [...baldes.keys()]
    const inicio = Math.min(...chavesComDados)
    const fim = Math.max(...chavesComDados)

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
