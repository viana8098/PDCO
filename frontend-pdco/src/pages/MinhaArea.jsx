import { useEffect, useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { ExecutiveBanner } from '../components/ExecutiveBanner'
import { RegraStatus } from '../components/RegraStatus'
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

    if (!planos.dados) {
        return (
            <div className="pdco-page">
                {filtros.erro ? (
                    <p className="pdco-estado pdco-erro">{filtros.erro}</p>
                ) : (
                    <p className="pdco-estado">Carregando planos…</p>
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

            <RegraStatus />

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

                {planos.dados.length === 0 ? (
                    <p className="pdco-vazio">Nenhum plano de cultura organizacional encontrado para o seu usuário.</p>
                ) : view === 'cards' ? (
                    <div className="pdco-card-grid">
                        {planos.dados.map((p) => (
                            <PlanCard key={p.cd_planoacao} plano={p} />
                        ))}
                    </div>
                ) : (
                    <div className="pdco-row-list">
                        {planos.dados.map((p) => (
                            <PlanRow key={p.cd_planoacao} plano={p} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
