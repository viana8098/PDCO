import { useEffect, useRef, useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { EsqueletoBanner, EsqueletoLista } from '../components/Animados'
import { ExecutiveBanner } from '../components/ExecutiveBanner'
import { PlanCard } from '../components/PlanCard'
import { PlanRow } from '../components/PlanRow'
import { SearchableSelect } from '../components/SearchableSelect'
import { pctConcluido } from '../lib/pdcoCalc'
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
    const [view, setView] = useState('lista')
    const [area, setArea] = useState('')
    const [planoFiltro, setPlanoFiltro] = useState('')

    const filtros = useAsync(() => api.filtros(user), [user], !!user)
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

    const titulo = administrador ? 'Visão consolidada' : nome ? `Planos de ${nome.split(' ')[0]}` : 'Meus planos'
    const metricas = administrador
        ? { area: pctConcluido(planos.dados), empresa: pctConcluido(todosPlanos.dados ?? planos.dados) }
        : { area: pctConcluido(planos.dados) }

    return (
        <div className="pdco-page">
            <ExecutiveBanner titulo={titulo} totalPlanos={planos.dados.length} metricas={metricas} />

            {administrador && (
                <div className="pdco-filters-row">
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
                    <span className="pdco-admin-badge">Administrador</span>
                </div>
            )}

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
        </div>
    )
}
