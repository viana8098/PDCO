import { useEffect, useRef, useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { EsqueletoBanner, EsqueletoLista } from '../components/Animados'
import { ComiteSecao } from '../components/ComiteSecao'
import { ExecutiveBanner } from '../components/ExecutiveBanner'
import { PlanCard } from '../components/PlanCard'
import { PlanRow } from '../components/PlanRow'
import { SearchableSelect } from '../components/SearchableSelect'
import { pctConcluido } from '../lib/pdcoCalc'
import { useFiltroPersistente } from '../lib/filtrosPersistentes'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

/**
 * Página inicial do PDCO. Gestor comum vê só os próprios planos (a API já
 * devolve a lista restrita). Administrador vê a mesma navegação consolidada
 * de hoje, com os filtros extra de Área/Ação — a visão exclusiva por área
 * (rollup, comparação entre áreas) fica na Diretoria.
 */
export default function MinhaArea() {
    const { user, administrador, nome } = usePdco()
    // Filtros que sobrevivem à navegação (lib/filtrosPersistentes.js). A área é compartilhada com as outras telas.
    const [view, setView] = useFiltroPersistente('visao-planos', 'lista')
    // Planos (lista de sempre) ou Comitê — qualquer usuário autenticado alterna (o que cada
    // um vê/edita dentro de Comitê depende do perfil, ver ComiteSecao).
    const [secao, setSecao] = useFiltroPersistente('minha-area:secao', 'planos')
    const [areaEscolhida, setArea] = useFiltroPersistente('area', '')
    const [planoEscolhido, setPlanoFiltro] = useFiltroPersistente('minha-area:plano', '')
    // Só vale com o filtro na tela: quem não tem o filtro não pode ficar com um recorte invisível vindo de outra tela.
    const mostrarFiltros = administrador
    const area = mostrarFiltros ? areaEscolhida : ''
    const planoFiltro = mostrarFiltros ? planoEscolhido : ''

    const filtros = useAsync(() => api.filtros(user), [user], !!user)
    // Valor guardado que não existe mais nas opções (ex.: o escopo mudou) volta pra "todas".
    useEffect(() => {
        if (!mostrarFiltros || !filtros.dados) return
        if (areaEscolhida && !filtros.dados.areas.some((o) => o.valor === areaEscolhida)) setArea('')
        if (planoEscolhido && !filtros.dados.planos.some((o) => o.valor === planoEscolhido)) setPlanoFiltro('')
    }, [mostrarFiltros, filtros.dados, areaEscolhida, planoEscolhido, setArea, setPlanoFiltro])
    const planos = useAsync(() => api.planos(user, { area, plano: planoFiltro }), [user, area, planoFiltro], !!user)
    // Só o admin precisa do total geral (pra comparar "filtrado" vs "empresa");
    // pro gestor comum a lista já vem restrita, os dois seriam iguais.
    const todosPlanos = useAsync(() => api.planos(user), [user], !!user && administrador)

    // Recarregando por causa de um filtro: a lista atual (ainda na tela) esmaece; se a API demorar,
    // esqueletos entram no lugar. Quando os dados novos chegam, a lista é remontada e entra em cascata.
    const refazendo = planos.carregando && !!planos.dados
    const [esqueleto, setEsqueleto] = useState(false)
    useEffect(() => {
        if (!refazendo) {
            setEsqueleto(false)
            return undefined
        }
        const t = setTimeout(() => setEsqueleto(true), 280)
        return () => clearTimeout(t)
    }, [refazendo])
    // Chave da lista = versão dos dados: só muda quando chegam dados novos, não a cada re-render.
    const versao = useRef({ dados: null, n: 0 })
    if (versao.current.dados !== planos.dados) versao.current = { dados: planos.dados, n: versao.current.n + 1 }
    const chaveLista = versao.current.n

    if (!planos.dados) {
        return (
            <div className="pdco-page">
                {filtros.erro || planos.erro ? (
                    <p className="pdco-estado pdco-erro">{filtros.erro || planos.erro}</p>
                ) : (
                    <>
                        <EsqueletoBanner />
                        <EsqueletoLista linhas={6} />
                    </>
                )}
            </div>
        )
    }

    const secaoAtiva = secao
    const titulo = administrador ? 'Visão consolidada' : nome ? `Planos de ${nome.split(' ')[0]}` : 'Meus planos'
    const metricas = administrador
        ? { area: pctConcluido(planos.dados), empresa: pctConcluido(todosPlanos.dados ?? planos.dados) }
        : { area: pctConcluido(planos.dados) }

    return (
        <div className="pdco-page">
            <ExecutiveBanner titulo={titulo} totalPlanos={planos.dados.length} metricas={metricas} />

            <div className="pdco-filters-row">
                {administrador && secaoAtiva === 'planos' && (
                    <>
                        <div className="pdco-filter-pill">
                            <label>Área</label>
                            <SearchableSelect
                                value={area}
                                onChange={setArea}
                                options={filtros.dados?.areas ?? []}
                                todosLabel="Todas as áreas"
                                disabled={!filtros.dados}
                            />
                        </div>
                        <div className="pdco-filter-pill">
                            <label>Plano de ação</label>
                            <SearchableSelect
                                value={planoFiltro}
                                onChange={setPlanoFiltro}
                                options={filtros.dados?.planos ?? []}
                                todosLabel="Todos os planos de ação"
                                disabled={!filtros.dados}
                            />
                        </div>
                    </>
                )}
                {administrador && <span className="pdco-admin-badge">Administrador</span>}
                <div className="pdco-toggle-group">
                    <button type="button" className={secaoAtiva === 'planos' ? 'pdco-toggle-ativo' : ''} onClick={() => setSecao('planos')}>
                        Planos
                    </button>
                    <button type="button" className={secaoAtiva === 'comite' ? 'pdco-toggle-ativo' : ''} onClick={() => setSecao('comite')}>
                        Comitê
                    </button>
                </div>
            </div>

            {secaoAtiva === 'comite' ? (
                <ComiteSecao
                    administrador={administrador}
                    opcoesArea={filtros.dados?.areas ?? []}
                    carregandoFiltros={!filtros.dados}
                />
            ) : (
                <div className="pdco-section">
                    <div className="pdco-section-head">
                        <h2 className="pdco-section-title">{administrador ? 'Todos os planos' : 'Meus planos'}</h2>
                        <div className="pdco-toggle-group">
                            <button
                                type="button"
                                className={view === 'cards' ? 'pdco-toggle-ativo' : ''}
                                onClick={() => setView('cards')}
                            >
                                Cards
                            </button>
                            <button
                                type="button"
                                className={view === 'lista' ? 'pdco-toggle-ativo' : ''}
                                onClick={() => setView('lista')}
                            >
                                Lista
                            </button>
                        </div>
                    </div>

                    <div className={`pdco-lista-area ${refazendo ? 'pdco-lista-atualizando' : ''}`} aria-busy={refazendo}>
                        {esqueleto ? (
                            <EsqueletoLista linhas={Math.min(Math.max(planos.dados.length, 3), 8)} cards={view === 'cards'} />
                        ) : planos.dados.length === 0 ? (
                            <p className="pdco-vazio">Nenhum plano de cultura organizacional encontrado para o seu usuário.</p>
                        ) : view === 'cards' ? (
                            <div className="pdco-card-grid" key={chaveLista}>
                                {planos.dados.map((p, i) => (
                                    <PlanCard key={p.cd_planoacao} plano={p} indice={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="pdco-row-list" key={chaveLista}>
                                {planos.dados.map((p, i) => (
                                    <PlanRow key={p.cd_planoacao} plano={p} indice={i} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
