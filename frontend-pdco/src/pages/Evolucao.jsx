import { useEffect, useMemo, useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { SearchableSelect } from '../components/SearchableSelect'
import { EvolucaoCards, EvolucaoFaixa } from '../components/EvolucaoResumo'
import { EvolucaoGrafico } from '../components/EvolucaoGrafico'
import { EvolucaoItem } from '../components/EvolucaoItem'
import { analisarCiclo, compararMeses, dataCurta, FOCOS, hojeLocalIso, itemNoFoco, montarCiclo, montarGrupos, TOTAL_MESES } from '../lib/evolucao'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

/** Quantos itens cada lista mostra antes do "Mostrar todos" — os blocos de acompanhamento chegam a dezenas. */
const LIMITE_BLOCO = 6
const LIMITE_MES = 12

export default function Evolucao() {
    const { user, administrador } = usePdco()
    const planos = useAsync(() => api.planos(user), [user], !!user)
    const [detalhes, setDetalhes] = useState(null)
    const [areaFiltro, setAreaFiltro] = useState('')
    // Escolha crua dos dois seletores (null = padrão: mês atual vs. anterior); a ordem é normalizada abaixo.
    const [escolha, setEscolha] = useState(null)
    const [foco, setFoco] = useState(null)
    const [modo, setModo] = useState('resumo')
    // Meses abertos na linha do tempo completa; null = só o mês final do período.
    const [abertos, setAbertos] = useState(null)
    const [mostrarSemAlteracao, setMostrarSemAlteracao] = useState(false)

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

    const hojeIso = useMemo(() => hojeLocalIso(), [])
    const ciclo = useMemo(() => (detalhes ? montarCiclo(detalhes, hojeIso) : null), [detalhes, hojeIso])
    // O filtro de Área recorta o universo inteiro (cartões, gráfico, resumo, mudanças e linha do tempo).
    const analise = useMemo(() => (ciclo ? analisarCiclo(detalhes, ciclo, areaFiltro || null, hojeIso) : null), [detalhes, ciclo, areaFiltro, hojeIso])

    const de = ciclo ? Math.min(escolha?.a ?? Math.max(1, ciclo.mesAtual - 1), escolha?.b ?? ciclo.mesAtual) : 1
    const para = ciclo ? Math.max(escolha?.a ?? Math.max(1, ciclo.mesAtual - 1), escolha?.b ?? ciclo.mesAtual) : 1
    const comp = useMemo(() => (analise ? compararMeses(analise, ciclo, de, para) : null), [analise, ciclo, de, para])

    if (!planos.dados || !detalhes) {
        return <div className="pdco-page pdco-estado">{planos.erro ? <span className="pdco-erro">{planos.erro}</span> : 'Carregando evolução…'}</div>
    }
    if (!ciclo) {
        return (
            <div className="pdco-page">
                <div className="pdco-page-head">
                    <h1 className="pdco-page-title">Evolução Mensal</h1>
                </div>
                <p className="pdco-vazio">Nenhum plano já iniciado — a evolução aparece a partir do início do primeiro plano.</p>
            </div>
        )
    }

    function selecionarPeriodo(a, b) {
        setEscolha({ a, b })
        setAbertos(null)
    }

    function alternarMes(mes) {
        setAbertos((prev) => {
            const proximo = new Set(prev ?? [para])
            if (proximo.has(mes)) proximo.delete(mes)
            else proximo.add(mes)
            return proximo
        })
    }

    const mesesSelecionaveis = ciclo.meses.filter((m) => !m.futuro)
    const abertosAtuais = abertos ?? new Set([para])
    const grupos = montarGrupos(comp, foco)
    const totalMudancas = comp.totais.concluidas + comp.totais.novosAtrasos + comp.totais.acompanhamentos + comp.totais.anexos
    const periodoTexto = `${comp.de.rotulo} → ${comp.para.rotulo}`

    return (
        <div className="pdco-page">
            <div className="pdco-page-head">
                <h1 className="pdco-page-title">Evolução Mensal</h1>
                <p className="pdco-page-sub">Compare o desempenho e identifique as principais mudanças ao longo do ciclo.</p>
            </div>

            {administrador && areas.length > 0 && (
                <div className="pdco-filters-row">
                    <div className="pdco-filter-pill">
                        <label>Área</label>
                        <SearchableSelect value={areaFiltro} onChange={setAreaFiltro} options={areas} todosLabel="Todas as áreas" />
                    </div>
                </div>
            )}

            <section className="pdco-panel pdco-evo-compare">
                <div className="pdco-evo-select-row">
                    <div className="pdco-evo-selects">
                        <label>
                            De
                            <select className="pdco-evo-select" value={de} onChange={(e) => selecionarPeriodo(Number(e.target.value), para)}>
                                {mesesSelecionaveis.map((m) => (
                                    <option key={m.mes} value={m.mes}>
                                        {m.rotulo} · Mês {m.mes}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <span aria-hidden="true">→</span>
                        <label>
                            Para
                            <select className="pdco-evo-select" value={para} onChange={(e) => selecionarPeriodo(de, Number(e.target.value))}>
                                {mesesSelecionaveis.map((m) => (
                                    <option key={m.mes} value={m.mes}>
                                        {m.rotulo} · Mês {m.mes}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <span className="pdco-admin-badge">Ciclo atual: Mês {ciclo.mesAtual}</span>
                </div>
                <p className="pdco-evo-nota">
                    Ciclo de {TOTAL_MESES} meses — Mês 1 = {ciclo.meses[0].rotulo} (início do plano mais recente).
                    {comp.mesmo && ` Comparando ${comp.para.rotulo} com o mês anterior (${comp.de.rotulo}).`}
                    {comp.para.atual && ` ${comp.para.rotulo} está em andamento (dados até ${dataCurta(comp.para.refIso)}): conclusões e acompanhamentos do mês ainda podem crescer.`}
                </p>

                {!analise.temDados ? (
                    <p className="pdco-vazio">Nenhuma ação, acompanhamento ou evidência para esta seleção.</p>
                ) : (
                    <>
                        <EvolucaoCards comp={comp} foco={foco} onFoco={setFoco} />
                        <EvolucaoFaixa comp={comp} foco={foco} onFoco={setFoco} />
                    </>
                )}
            </section>

            {analise.temDados && (
                <section className="pdco-panel">
                    <div className="pdco-panel-header">
                        <p className="pdco-kicker">Comparativo do ciclo</p>
                        <h2 className="pdco-panel-title">Mês a mês</h2>
                    </div>
                    <EvolucaoGrafico
                        meses={analise.meses}
                        selecionado={para}
                        comparado={comp.mesmo ? null : de}
                        onSelecionar={(mes) => selecionarPeriodo(Math.max(1, mes - 1), mes)}
                    />
                </section>
            )}

            <section className="pdco-panel">
                <div className="pdco-panel-header pdco-evo-timeline-header">
                    <div>
                        <p className="pdco-kicker">Mudanças do período</p>
                        <h2 className="pdco-panel-title">O que mudou · {periodoTexto}</h2>
                    </div>
                    <div className="pdco-toggle-group" role="group" aria-label="Nível de detalhe">
                        <button type="button" className={modo === 'resumo' ? 'pdco-toggle-ativo' : ''} aria-pressed={modo === 'resumo'} onClick={() => setModo('resumo')}>
                            Resumo
                        </button>
                        <button type="button" className={modo === 'detalhado' ? 'pdco-toggle-ativo' : ''} aria-pressed={modo === 'detalhado'} onClick={() => setModo('detalhado')}>
                            Detalhado
                        </button>
                    </div>
                </div>

                {foco && (
                    <div className="pdco-evo-filtro-ativo">
                        <span>
                            Filtrando por: <strong>{FOCOS[foco].rotulo}</strong>
                        </span>
                        <button type="button" onClick={() => setFoco(null)}>
                            Limpar filtro
                        </button>
                    </div>
                )}

                <div className="pdco-evo-mudancas">
                    {!foco && totalMudancas === 0 && <p className="pdco-vazio">Nenhuma mudança registrada entre {periodoTexto}.</p>}
                    {grupos.map((g) => {
                        if (g.recolhido) {
                            return (
                                <div className="pdco-evo-grupo" key={g.id}>
                                    <button type="button" className="pdco-evo-mais" aria-expanded={mostrarSemAlteracao} onClick={() => setMostrarSemAlteracao((v) => !v)}>
                                        {mostrarSemAlteracao ? 'Ocultar' : 'Mostrar'} ações sem alteração ({g.itens.length})
                                    </button>
                                    {mostrarSemAlteracao && <GrupoLista itens={g.itens} limite={LIMITE_BLOCO} />}
                                </div>
                            )
                        }
                        // Sem nenhuma mudança, a mensagem acima basta — não repete quatro blocos vazios.
                        if (!foco && totalMudancas === 0) return null
                        return (
                            <div className="pdco-evo-grupo" key={g.id}>
                                <h3 className="pdco-evo-grupo-titulo">
                                    {g.titulo} <span className="pdco-evo-grupo-n">{g.itens.length}</span>
                                </h3>
                                {g.itens.length === 0 ? <p className="pdco-month-vazio">Nada nesta categoria no período.</p> : <GrupoLista itens={g.itens} limite={LIMITE_BLOCO} />}
                            </div>
                        )
                    })}
                </div>
            </section>

            {modo === 'detalhado' && (
                <section className="pdco-panel">
                    <div className="pdco-panel-header">
                        <p className="pdco-kicker">Linha do tempo completa</p>
                        <h2 className="pdco-panel-title">Todos os meses do ciclo</h2>
                    </div>
                    <div className="pdco-month-list">
                        {analise.meses.map((m, i) => {
                            const aberto = abertosAtuais.has(m.mes)
                            const eventos = m.eventos.filter((e) => itemNoFoco(e, foco))
                            const met = m.metricas
                            return (
                                <div key={m.mes}>
                                    {i > 0 && m.ano !== analise.meses[i - 1].ano && <div className="pdco-evo-ano">{m.ano}</div>}
                                    <div className={`pdco-month-item ${eventos.length > 0 ? 'pdco-month-com-registro' : ''}`}>
                                        <button type="button" className="pdco-month-item-head" aria-expanded={aberto} disabled={m.futuro} onClick={() => alternarMes(m.mes)}>
                                            <span className="pdco-month-dot" />
                                            <span className="pdco-month-label">
                                                {m.rotulo} · Mês {m.mes}
                                                {m.atual && <span className="pdco-evo-tag-atual"> atual</span>}
                                            </span>
                                            <span className="pdco-month-resumo">
                                                {met ? `${met.concluidas} concl. · ${met.novosAtrasos} novos atrasos · ${met.acompanhamentos} acomp.` : 'Ainda não iniciado'}
                                            </span>
                                            <span className={`pdco-month-caret ${aberto ? 'pdco-month-caret-aberto' : ''}`}>▾</span>
                                        </button>
                                        {aberto && (
                                            <div className="pdco-month-item-body">
                                                {eventos.length === 0 && <p className="pdco-month-vazio">Sem movimentações neste mês.</p>}
                                                <GrupoLista itens={eventos} limite={LIMITE_MES} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}
        </div>
    )
}

/** Lista de itens de um bloco, limitada aos primeiros com "Mostrar todos". */
function GrupoLista({ itens, limite }) {
    const [todos, setTodos] = useState(false)
    const visiveis = todos ? itens : itens.slice(0, limite)
    return (
        <>
            <div className="pdco-evo-lista">
                {visiveis.map((item) => (
                    <EvolucaoItem item={item} key={item.id} />
                ))}
            </div>
            {itens.length > limite && (
                <button type="button" className="pdco-evo-mais" onClick={() => setTodos((v) => !v)}>
                    {todos ? 'Mostrar menos' : `Mostrar todos (${itens.length})`}
                </button>
            )}
        </>
    )
}
