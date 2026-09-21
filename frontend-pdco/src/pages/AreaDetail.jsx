import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { ExecutiveBanner } from '../components/ExecutiveBanner'
import { PlanCard } from '../components/PlanCard'
import { PlanRow } from '../components/PlanRow'
import { pctConcluido } from '../lib/pdcoCalc'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

// Planos de uma área específica — acessado a partir da Diretoria (só admin).
export default function AreaDetail() {
    const { user, administrador, carregando } = usePdco()
    const { areaChave } = useParams()
    const [view, setView] = useState('lista')

    const planos = useAsync(() => api.planos(user), [user], !!user && administrador)

    const planosArea = useMemo(
        () => (planos.dados ?? []).filter((p) => (p.area_codigo || p.area_nome || 'sem-area') === areaChave),
        [planos.dados, areaChave],
    )

    if (carregando) return <div className="pdco-page pdco-estado">Carregando…</div>
    if (!administrador) return <Navigate to="/" replace />
    if (!planos.dados) {
        return <div className="pdco-page">{planos.erro ? <p className="pdco-estado pdco-erro">{planos.erro}</p> : <p className="pdco-estado">Carregando…</p>}</div>
    }

    const areaNome = planosArea[0]?.area_nome || 'Área'
    const metricas = { area: pctConcluido(planosArea), empresa: pctConcluido(planos.dados) }

    return (
        <div className="pdco-page">
            <Link to="/diretoria" className="pdco-voltar">
                ← Voltar à Diretoria
            </Link>

            <ExecutiveBanner titulo={areaNome} totalPlanos={planosArea.length} metricas={metricas} />

            <div className="pdco-section">
                <div className="pdco-section-head">
                    <h2 className="pdco-section-title">Planos da área</h2>
                    <div className="pdco-toggle-group">
                        <button type="button" className={view === 'cards' ? 'pdco-toggle-ativo' : ''} onClick={() => setView('cards')}>
                            Cards
                        </button>
                        <button type="button" className={view === 'lista' ? 'pdco-toggle-ativo' : ''} onClick={() => setView('lista')}>
                            Lista
                        </button>
                    </div>
                </div>

                {planosArea.length === 0 ? (
                    <p className="pdco-vazio">Nenhum plano cadastrado para esta área.</p>
                ) : view === 'cards' ? (
                    <div className="pdco-card-grid">
                        {planosArea.map((p, i) => (
                            <PlanCard key={p.cd_planoacao} plano={p} indice={i} />
                        ))}
                    </div>
                ) : (
                    <div className="pdco-row-list">
                        {planosArea.map((p, i) => (
                            <PlanRow key={p.cd_planoacao} plano={p} indice={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
