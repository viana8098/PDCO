import { useEffect, useMemo, useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { SearchableSelect } from '../components/SearchableSelect'
import { formatarData, indiceMesRelativo, tituloDoPlano } from '../lib/pdcoCalc'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

const TOTAL_MESES = 8

function moda(lista) {
    if (lista.length === 0) return 1
    const contagem = new Map()
    for (const v of lista) contagem.set(v, (contagem.get(v) ?? 0) + 1)
    return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * Agrega ações e acompanhamentos de todos os planos visíveis pelo ÍNDICE
 * relativo do mês (1-8, ver AcompanhamentoGrid/domain montarJanelaAcompanhamento)
 * — não pelo mês de calendário, porque cada plano começa numa data diferente.
 * "Mês 3" aqui significa "o 3º mês de cada plano dentro do próprio ciclo",
 * então dá pra comparar plano com plano mesmo com datas de início diferentes.
 */
function agregarPorMesRelativo(detalhes, areaFiltro) {
    const meses = Array.from({ length: TOTAL_MESES }, (_, i) => ({ mes: i + 1, concluidas: 0, acompanhamentos: 0, atrasadas: 0, eventos: [] }))
    const hoje = new Date()
    const hojeIso = hoje.toISOString().slice(0, 10)
    const mesesAtuais = []

    for (const { plano, acoes, acompanhamento } of detalhes) {
        // "Ciclo atual" é global — não muda com o filtro de área, senão o
        // selo "atual" ficaria pulando de mês conforme o filtro escolhido.
        const idxAtual = indiceMesRelativo(plano.data_inicio, hojeIso)
        if (idxAtual !== null) mesesAtuais.push(Math.min(Math.max(idxAtual + 1, 1), TOTAL_MESES))

        // Área é um atributo do plano — todas as ações e acompanhamentos dele
        // compartilham a mesma área, então o filtro é por plano.
        if (areaFiltro && (plano.area_codigo || plano.area_nome || 'sem-area') !== areaFiltro) continue

        for (const acao of acoes) {
            const idx = indiceMesRelativo(plano.data_inicio, acao.prazo_final)
            if (idx === null || idx < 0 || idx >= TOTAL_MESES) continue
            const bucket = meses[idx]
            const status = (acao.status || '').toLowerCase()
            if (status.startsWith('conclu')) {
                bucket.concluidas++
                bucket.eventos.push({
                    tipo: 'acao',
                    titulo: acao.nome,
                    detalhe: `Ação concluída · ${tituloDoPlano(plano)}`,
                    data: acao.prazo_final,
                    responsavel: acao.responsavel,
                })
            } else if (!status.startsWith('cancel') && acao.prazo_final && new Date(acao.prazo_final) < hoje) {
                bucket.atrasadas++
            }
        }

        for (const quadrante of acompanhamento) {
            const bucket = meses[quadrante.mes - 1]
            for (const registro of quadrante.registros) {
                bucket.acompanhamentos++
                // O dw não guarda quem escreveu o acompanhamento — atribuído ao
                // responsável do plano, a melhor aproximação disponível.
                bucket.eventos.push({
                    tipo: 'acompanhamento',
                    titulo: tituloDoPlano(plano),
                    detalhe: registro.texto,
                    data: registro.data,
                    responsavel: plano.responsavel,
                })
            }
        }
    }

    meses.forEach((m) => m.eventos.sort((a, b) => (b.data || '').localeCompare(a.data || '')))
    return { meses, mesAtual: moda(mesesAtuais) }
}

export default function Evolucao() {
    const { user, administrador } = usePdco()
    const planos = useAsync(() => api.planos(user), [user], !!user)
    const [detalhes, setDetalhes] = useState(null)
    const [horizontal, setHorizontal] = useState(false)
    const [abertos, setAbertos] = useState(() => new Set())
    const [mesA, setMesA] = useState(null)
    const [mesB, setMesB] = useState(null)
    const [areaFiltro, setAreaFiltro] = useState('')

    useEffect(() => {
        if (!planos.dados) return
        let ativo = true
        Promise.all(planos.dados.map((p) => api.plano(user, p.cd_planoacao).catch(() => null))).then(
            (lista) => ativo && setDetalhes(lista.filter(Boolean)),
        )
        return () => {
            ativo = false
        }
    }, [planos.dados, user])

    // Lista de áreas pra filtrar, sem repetir. Só faz sentido pro
    // administrador: é ele quem enxerga o conjunto todo de planos e precisa
    // desse recorte pra não rolar o feed inteiro.
    const areas = useMemo(() => {
        if (!planos.dados) return []
        const mapa = new Map()
        for (const p of planos.dados) {
            const chave = p.area_codigo || p.area_nome || 'sem-area'
            if (!mapa.has(chave)) mapa.set(chave, { valor: chave, rotulo: p.area_nome || 'Sem área' })
        }
        return [...mapa.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { numeric: true }))
    }, [planos.dados])

    const areaFiltroRotulo = areas.find((a) => a.valor === areaFiltro)?.rotulo

    const agregado = useMemo(
        () => (detalhes ? agregarPorMesRelativo(detalhes, areaFiltro || null) : null),
        [detalhes, areaFiltro],
    )

    useEffect(() => {
        if (agregado && mesA === null) {
            setMesA(agregado.mesAtual)
            setMesB(Math.max(1, agregado.mesAtual - 1))
        }
    }, [agregado, mesA])

    if (!planos.dados || !agregado || mesA === null) {
        return <div className="pdco-page pdco-estado">{planos.erro ? <span className="pdco-erro">{planos.erro}</span> : 'Carregando evolução…'}</div>
    }

    const atual = agregado.meses[mesA - 1]
    const anterior = agregado.meses[mesB - 1]
    const deltaConcluidas = atual.concluidas - anterior.concluidas
    const deltaAcomp = atual.acompanhamentos - anterior.acompanhamentos
    const deltaAtrasadas = atual.atrasadas - anterior.atrasadas

    function alternar(mes) {
        setAbertos((prev) => {
            const proximo = new Set(prev)
            if (proximo.has(mes)) proximo.delete(mes)
            else proximo.add(mes)
            return proximo
        })
    }

    return (
        <div className="pdco-page">
            <div className="pdco-page-head">
                <h1 className="pdco-page-title">Evolução Mensal</h1>
                <p className="pdco-page-sub">
                    O que evoluiu de um mês para o outro, ao longo do ciclo de {TOTAL_MESES} meses —{' '}
                    {areaFiltroRotulo ? `planos e ações da área ${areaFiltroRotulo}` : 'combinando todos os planos que você acompanha'}.
                </p>
            </div>

            {administrador && areas.length > 0 && (
                <div className="pdco-filters-row">
                    <div className="pdco-filter-pill">
                        <label>Área</label>
                        <SearchableSelect
                            value={areaFiltro}
                            onChange={setAreaFiltro}
                            options={areas}
                            todosLabel="Todas as áreas"
                        />
                    </div>
                </div>
            )}

            <section className="pdco-panel pdco-evo-compare">
                <div className="pdco-evo-select-row">
                    <div className="pdco-evo-selects">
                        <select className="pdco-evo-select" value={mesA} onChange={(e) => setMesA(Number(e.target.value))}>
                            {Array.from({ length: TOTAL_MESES }, (_, i) => (
                                <option key={i} value={i + 1}>
                                    Mês {i + 1}
                                </option>
                            ))}
                        </select>
                        <span>vs</span>
                        <select className="pdco-evo-select" value={mesB} onChange={(e) => setMesB(Number(e.target.value))}>
                            {Array.from({ length: TOTAL_MESES }, (_, i) => (
                                <option key={i} value={i + 1}>
                                    Mês {i + 1}
                                </option>
                            ))}
                        </select>
                    </div>
                    <span className="pdco-admin-badge">Ciclo atual: Mês {agregado.mesAtual}</span>
                </div>

                <div className="pdco-evo-diff-grid">
                    <DiffCard label="Ações concluídas" valor={atual.concluidas} delta={deltaConcluidas} />
                    <DiffCard label="Acompanhamentos" valor={atual.acompanhamentos} delta={deltaAcomp} />
                    <DiffCard label="Ações atrasadas" valor={atual.atrasadas} delta={deltaAtrasadas} inverso />
                </div>
            </section>

            <section className="pdco-panel">
                <div className="pdco-panel-header pdco-evo-timeline-header">
                    <div>
                        <p className="pdco-kicker">Linha do tempo do ciclo</p>
                        <h2 className="pdco-panel-title">Mês a mês</h2>
                    </div>
                    <div className="pdco-toggle-group">
                        <button type="button" className={!horizontal ? 'pdco-toggle-ativo' : ''} onClick={() => setHorizontal(false)}>
                            Vertical
                        </button>
                        <button type="button" className={horizontal ? 'pdco-toggle-ativo' : ''} onClick={() => setHorizontal(true)}>
                            Horizontal
                        </button>
                    </div>
                </div>

                {horizontal ? (
                    <div className="pdco-evo-horizontal">
                        {agregado.meses.map((m) => (
                            <MesCard key={m.mes} mes={m} atual={m.mes === agregado.mesAtual} aberto={abertos.has(m.mes)} onToggle={() => alternar(m.mes)} />
                        ))}
                    </div>
                ) : (
                    <div className="pdco-month-list">
                        {agregado.meses.map((m) => {
                            const aberto = abertos.has(m.mes)
                            const temAlgo = m.eventos.length > 0
                            return (
                                <div className={`pdco-month-item ${temAlgo ? 'pdco-month-com-registro' : ''}`} key={m.mes}>
                                    <button type="button" className="pdco-month-item-head" onClick={() => alternar(m.mes)}>
                                        <span className="pdco-month-dot" />
                                        <span className="pdco-month-label">
                                            Mês {m.mes}
                                            {m.mes === agregado.mesAtual && <span className="pdco-evo-tag-atual"> atual</span>}
                                        </span>
                                        <span className="pdco-month-resumo">
                                            {m.concluidas} concl. · {m.acompanhamentos} ac.
                                        </span>
                                        <span className={`pdco-month-caret ${aberto ? 'pdco-month-caret-aberto' : ''}`}>▾</span>
                                    </button>
                                    {aberto && (
                                        <div className="pdco-month-item-body">
                                            {!temAlgo && <p className="pdco-month-vazio">Sem movimentações.</p>}
                                            {m.eventos.map((evento, indice) => (
                                                <EventoLinha evento={evento} key={indice} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

const ICONE = {
    acompanhamento: (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 4.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-4 3v-3H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
        </svg>
    ),
    acao: (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="10" cy="10" r="7.25" />
            <path d="M6.8 10.2l2.1 2.1 4.3-4.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
}

function EventoLinha({ evento }) {
    return (
        <div className={`pdco-evento-linha pdco-evento-${evento.tipo}`}>
            <span className="pdco-evento-icone">{ICONE[evento.tipo]}</span>
            <div className="pdco-evento-corpo">
                <p className="pdco-evento-titulo">{evento.titulo}</p>
                <p className="pdco-evento-detalhe">{evento.detalhe}</p>
                <p className="pdco-evento-meta">
                    {formatarData(evento.data)}
                    {evento.responsavel && ` · ${evento.responsavel}`}
                </p>
            </div>
        </div>
    )
}

function DiffCard({ label, valor, delta, inverso }) {
    const positivo = inverso ? delta < 0 : delta > 0
    const negativo = inverso ? delta > 0 : delta < 0
    return (
        <div className="pdco-evo-diff-card">
            <p className="pdco-stat-label">{label}</p>
            <p className="pdco-stat-valor">{valor}</p>
            <p className={`pdco-evo-delta ${positivo ? 'pdco-evo-delta-pos' : negativo ? 'pdco-evo-delta-neg' : ''}`}>
                {delta === 0 ? 'sem variação' : `${delta > 0 ? '+' : ''}${delta} vs mês comparado`}
            </p>
        </div>
    )
}

function MesCard({ mes, atual, aberto, onToggle }) {
    return (
        <div className={`pdco-evo-mes-card ${atual ? 'pdco-evo-mes-card-atual' : ''}`}>
            <button type="button" className="pdco-evo-mes-card-head" onClick={onToggle}>
                <span className="pdco-month-label">
                    Mês {mes.mes}
                    {atual && <span className="pdco-evo-tag-atual"> atual</span>}
                </span>
                <span className={`pdco-month-caret ${aberto ? 'pdco-month-caret-aberto' : ''}`}>▾</span>
            </button>
            <p className="pdco-month-resumo">
                {mes.concluidas} concl. · {mes.acompanhamentos} ac. · {mes.atrasadas} atras.
            </p>
            {aberto && (
                <div className="pdco-evo-mes-card-body">
                    {mes.eventos.length === 0 && <p className="pdco-month-vazio">Sem movimentações.</p>}
                    {mes.eventos.map((evento, indice) => (
                        <EventoLinha evento={evento} key={indice} />
                    ))}
                </div>
            )}
        </div>
    )
}
